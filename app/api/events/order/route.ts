import { inngest } from '@/inngest/client';

// POST /api/events/order - Send order.created event to Inngest
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { orderId, customerName, tableNumber, items } = body as {
      orderId: number;
      customerName: string;
      tableNumber: number;
      items: Array<{
        foodType: FastFood['FoodType'];
        quantity: number;
      }>;
    };

    // Validate request
    if (!orderId || !tableNumber || !items || items.length === 0) {
      return Response.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Send event to Inngest
    await inngest.send({
      name: 'order.created',
      data: {
        orderId,
        customerName: customerName || null,
        tableNumber,
        items,
      },
    });

    return Response.json({
      success: true,
      data: { orderId, eventSent: true },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send event',
      },
      { status: 500 }
    );
  }
};