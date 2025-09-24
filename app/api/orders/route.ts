import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';

// Using the global ApiResponse type from types.d.ts
type Order = FastFood['Order'];

// GET /api/orders - List all orders with their items
export const GET = async (): Promise<Response> => {
  try {
    const ordersList = await db
      .select()
      .from(orders)
      .orderBy(orders.createdAt);

    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    const response = {
      success: true,
      data: ordersWithItems,
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    };
    return Response.json(response, { status: 500 });
  }
};

// POST /api/orders - Create a new order
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { customerName, tableNumber, items } = body as {
      customerName?: string;
      tableNumber: number;
      items: Array<{
        foodType: FastFood['FoodType'];
        quantity: number;
      }>;
    };

    // Validate request
    if (!tableNumber || !items || items.length === 0) {
      const response = {
        success: false,
        error: 'Invalid request: tableNumber and items are required',
      };
      return Response.json(response, { status: 400 });
    }

    // Create order
    const orderInsert: InferInsertModel<typeof orders> = {
      customerName: customerName || undefined, // Will use database default 'Guest' if undefined
      tableNumber,
      status: 'pending',
    };

    const [newOrder] = await db.insert(orders).values(orderInsert).returning();

    // Create order items
    const orderItemsInsert: InferInsertModel<typeof orderItems>[] = items.map((item) => ({
      orderId: newOrder.id,
      foodType: item.foodType,
      quantity: item.quantity,
    }));

    await db.insert(orderItems).values(orderItemsInsert);

    // Fetch complete order with items
    const completeItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, newOrder.id));

    const completeOrder: Order = {
      ...newOrder,
      items: completeItems,
    };

    const response = {
      success: true,
      data: completeOrder,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
    return Response.json(response, { status: 500 });
  }
};