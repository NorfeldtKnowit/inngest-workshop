import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Order = FastFood['Order'];

// GET /api/orders/[id] - Get a single order with its items
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      const response = {
        success: false,
        error: 'Invalid order ID',
      };
      return Response.json(response, { status: 400 });
    }

    // Fetch order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      const response = {
        success: false,
        error: 'Order not found',
      };
      return Response.json(response, { status: 404 });
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const completeOrder: Order = {
      ...order,
      items,
    };

    const response = {
      success: true,
      data: completeOrder,
    };

    return Response.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order',
    };
    return Response.json(response, { status: 500 });
  }
};