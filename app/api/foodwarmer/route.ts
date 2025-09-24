import { db } from '@/db';
import { foodWarmer } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';

type FoodWarmerItem = FastFood['FoodWarmerItem'];
type FoodType = FastFood['FoodType'];

// GET /api/foodwarmer - Get current inventory (all items)
export const GET = async (): Promise<Response> => {
  try {
    // Fetch ALL items from food warmer
    const inventory = await db
      .select()
      .from(foodWarmer)
      .orderBy(foodWarmer.expiresAt);

    // Group by food type with total quantities (count items)
    const inventoryByType = inventory.reduce((acc, item) => {
      const existing = acc.find(i => i.foodType === item.foodType);
      if (existing) {
        existing.quantity += 1; // Each row is one item
        existing.items.push(item);
      } else {
        acc.push({
          foodType: item.foodType as FoodType,
          quantity: 1, // Each row is one item
          items: [item],
        });
      }
      return acc;
    }, [] as Array<{
      foodType: FoodType;
      quantity: number;
      items: FoodWarmerItem[];
    }>);

    const response = {
      success: true,
      data: {
        inventory,
        summary: inventoryByType,
      },
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory',
    };
    return Response.json(response, { status: 500 });
  }
};

// DELETE /api/foodwarmer?foodType=burger&quantity=1 - Remove items by food type
export const DELETE = async (request: Request): Promise<Response> => {
  try {
    const { searchParams } = new URL(request.url);
    const foodType = searchParams.get('foodType') as FoodType | null;
    const quantityParam = searchParams.get('quantity');
    const quantity = quantityParam ? parseInt(quantityParam, 10) : 1;

    // Validate request
    if (!foodType) {
      const response = {
        success: false,
        error: 'foodType query parameter is required',
      };
      return Response.json(response, { status: 400 });
    }

    // Validate food type
    const validFoodTypes: FoodType[] = ['fries', 'burger', 'soda'];
    if (!validFoodTypes.includes(foodType)) {
      const response = {
        success: false,
        error: 'Invalid food type. Must be one of: ' + validFoodTypes.join(', '),
      };
      return Response.json(response, { status: 400 });
    }

    if (isNaN(quantity) || quantity <= 0) {
      const response = {
        success: false,
        error: 'quantity must be a positive number',
      };
      return Response.json(response, { status: 400 });
    }

    // Fetch items to remove (FIFO - oldest first)
    const itemsToRemove = await db
      .select()
      .from(foodWarmer)
      .where(eq(foodWarmer.foodType, foodType))
      .orderBy(foodWarmer.expiresAt)
      .limit(quantity);

    if (itemsToRemove.length === 0) {
      const response = {
        success: false,
        error: `No ${foodType} items found in warmer`,
      };
      return Response.json(response, { status: 404 });
    }

    // Remove the items
    const removedIds = itemsToRemove.map(item => item.id);
    await db
      .delete(foodWarmer)
      .where(sql`${foodWarmer.id} IN (${sql.join(removedIds, sql`, `)})`);

    const response = {
      success: true,
      data: {
        removed: itemsToRemove.length,
        requested: quantity,
        foodType,
        items: itemsToRemove.map(item => ({
          id: item.id,
          expiresAt: item.expiresAt,
        })),
      },
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove items from warmer',
    };
    return Response.json(response, { status: 500 });
  }
};

// POST /api/foodwarmer - Add items to the warmer (creates multiple rows)
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { foodType, quantity, shelfLife } = body as {
      foodType: FoodType;
      quantity: number;
      shelfLife?: number; // Optional, will use default if not provided
    };

    // Validate request
    if (!foodType || !quantity || quantity <= 0) {
      const response = {
        success: false,
        error: 'Invalid request: foodType and positive quantity are required',
      };
      return Response.json(response, { status: 400 });
    }

    // Validate food type
    const validFoodTypes: FoodType[] = ['fries', 'burger', 'soda'];
    if (!validFoodTypes.includes(foodType)) {
      const response = {
        success: false,
        error: 'Invalid food type. Must be one of: ' + validFoodTypes.join(', '),
      };
      return Response.json(response, { status: 400 });
    }

    // Default shelf lives in milliseconds
    const defaultShelfLives: Record<FoodType, number> = {
      fries: 8000,      // 8 seconds
      burger: 10000,    // 10 seconds
      soda: Infinity,   // Never expires
    };

    const actualShelfLife = shelfLife ?? defaultShelfLives[foodType];
    const expiresAt = actualShelfLife === Infinity 
      ? new Date('2099-12-31') // Far future date for non-expiring items
      : new Date(Date.now() + actualShelfLife);

    // Create array of items (one row per item)
    const foodWarmerInserts: InferInsertModel<typeof foodWarmer>[] = Array(quantity).fill(null).map(() => ({
      foodType,
      expiresAt,
    }));

    const newItems = await db
      .insert(foodWarmer)
      .values(foodWarmerInserts)
      .returning();

    const response = {
      success: true,
      data: newItems,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add items to warmer',
    };
    return Response.json(response, { status: 500 });
  }
};