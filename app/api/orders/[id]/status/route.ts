import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

type OrderStatus = FastFood['OrderStatus'];

// PUT /api/orders/[id]/status - Update order status
export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    const body = await request.json();
    const { status } = body as { status: OrderStatus };

    if (isNaN(orderId)) {
      const response = {
        success: false,
        error: 'Invalid order ID',
      };
      return Response.json(response, { status: 400 });
    }

    // Validate status
    const validStatuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      const response = {
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      };
      return Response.json(response, { status: 400 });
    }

    // Check if order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrder) {
      const response = {
        success: false,
        error: 'Order not found',
      };
      return Response.json(response, { status: 404 });
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(orders.id, orderId))
      .returning();

    const response = {
      success: true,
      data: {
        id: updatedOrder.id,
        status: updatedOrder.status as OrderStatus,
        updatedAt: updatedOrder.updatedAt,
      },
    };

    return Response.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    };
    return Response.json(response, { status: 500 });
  }
};