import { db } from '@/db';
import { foodWarmer, wasteLog } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';


// DELETE /api/foodwarmer/[id] - Remove expired items and log waste
export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      const response = {
        success: false,
        error: 'Invalid item ID',
      };
      return Response.json(response, { status: 400 });
    }

    // Fetch the item to be removed
    const [item] = await db
      .select()
      .from(foodWarmer)
      .where(eq(foodWarmer.id, itemId));

    if (!item) {
      const response = {
        success: false,
        error: 'Item not found',
      };
      return Response.json(response, { status: 404 });
    }

    // Check if item is expired
    const isExpired = new Date(item.expiresAt) < new Date();

    // Log waste if expired
    if (isExpired) {
      const wasteEntry: InferInsertModel<typeof wasteLog> = {
        foodType: item.foodType,
        quantity: 1, // Each row is one item
        reason: 'expired',
      };

      await db.insert(wasteLog).values(wasteEntry);
    }

    // Remove the item
    await db.delete(foodWarmer).where(eq(foodWarmer.id, itemId));

    const response = {
      success: true,
      data: {
        removed: true,
        wasExpired: isExpired,
        item: {
          id: item.id,
          foodType: item.foodType,
        },
      },
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item',
    };
    return Response.json(response, { status: 500 });
  }
};

// Alternative endpoint to remove all expired items
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { removeAllExpired } = body as { removeAllExpired?: boolean };

    if (!removeAllExpired) {
      const response = {
        success: false,
        error: 'Invalid request: set removeAllExpired to true to remove all expired items',
      };
      return Response.json(response, { status: 400 });
    }

    const currentTime = new Date();

    // Fetch all expired items
    const expiredItems = await db
      .select()
      .from(foodWarmer)
      .where(lt(foodWarmer.expiresAt, currentTime));

    if (expiredItems.length === 0) {
      const response = {
        success: true,
        data: {
          message: 'No expired items found',
          removedCount: 0,
        },
      };
      return Response.json(response);
    }

    // Log all expired items as waste (one entry per item)
    const wasteEntries: InferInsertModel<typeof wasteLog>[] = expiredItems.map(item => ({
      foodType: item.foodType,
      quantity: 1, // Each row is one item
      reason: 'expired',
    }));

    await db.insert(wasteLog).values(wasteEntries);

    // Remove all expired items
    await db.delete(foodWarmer).where(lt(foodWarmer.expiresAt, currentTime));

    const response = {
      success: true,
      data: {
        message: 'Expired items removed and logged as waste',
        removedCount: expiredItems.length,
        totalQuantity: expiredItems.length, // Count of items
        items: expiredItems.map(item => ({
          foodType: item.foodType,
        })),
      },
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove expired items',
    };
    return Response.json(response, { status: 500 });
  }
};