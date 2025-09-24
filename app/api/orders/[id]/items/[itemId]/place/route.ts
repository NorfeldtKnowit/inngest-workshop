import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
): Promise<Response> => {
  try {
    const { id, itemId } = await params;
    const orderId = parseInt(id);
    const itemIdNum = parseInt(itemId);
    
    if (isNaN(orderId) || isNaN(itemIdNum)) {
      return Response.json(
        { success: false, error: 'Invalid order ID or item ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return Response.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Get the current item to check constraints
    const [currentItem] = await db
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.id, itemIdNum), eq(orderItems.orderId, orderId)));

    if (!currentItem) {
      return Response.json(
        { success: false, error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Ensure we don't place more than ordered
    const newPlacedTotal = currentItem.placedOnTray + quantity;
    if (newPlacedTotal > currentItem.quantity) {
      return Response.json(
        { 
          success: false, 
          error: `Cannot place ${quantity} items. Only ${currentItem.quantity - currentItem.placedOnTray} remaining.` 
        },
        { status: 400 }
      );
    }

    // Update the placed count
    const [updatedItem] = await db
      .update(orderItems)
      .set({ 
        placedOnTray: newPlacedTotal
      })
      .where(and(eq(orderItems.id, itemIdNum), eq(orderItems.orderId, orderId)))
      .returning();

    const response = {
      success: true,
      data: updatedItem,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error placing item on tray:', error);
    return Response.json(
      { success: false, error: 'Failed to place item on tray' },
      { status: 500 }
    );
  }
};