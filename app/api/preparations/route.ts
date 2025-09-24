import { db } from '@/db';
import { activePreparations } from '@/db/schema';
import type { InferInsertModel } from 'drizzle-orm';

type FoodType = FastFood['FoodType'];

// GET /api/preparations - Get all active preparations
export const GET = async (): Promise<Response> => {
  try {
    // Fetch all preparations
    const preparations = await db
      .select()
      .from(activePreparations)
      .orderBy(activePreparations.completesAt);

    const response = {
      success: true,
      data: preparations,
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch preparations',
    };
    return Response.json(response, { status: 500 });
  }
};

// POST /api/preparations - Start a new preparation batch
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { foodType = 'burger', quantity = 5, prepTime = 3000 } = body as {
      foodType?: FoodType;
      quantity?: number;
      prepTime?: number; // milliseconds
    };

    // For now, we're focusing on burger batches
    if (foodType !== 'burger') {
      const response = {
        success: false,
        error: 'Currently only burger batches are supported',
      };
      return Response.json(response, { status: 400 });
    }

    const now = new Date();
    const completesAt = new Date(now.getTime() + prepTime);

    const preparationInsert: InferInsertModel<typeof activePreparations> = {
      foodType,
      quantity,
      status: 'preparing',
      completesAt,
    };

    const [newPreparation] = await db
      .insert(activePreparations)
      .values(preparationInsert)
      .returning();

    const response = {
      success: true,
      data: newPreparation,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    console.error('Error starting preparation:', error);
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start preparation',
    };
    return Response.json(response, { status: 500 });
  }
};

