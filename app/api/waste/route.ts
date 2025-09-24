import { db } from '@/db';
import { wasteLog } from '@/db/schema';
import { gte, lte, sql, and } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';

type FoodType = FastFood['FoodType'];
type WasteReason = FastFood['WasteReason'];

// GET /api/waste - Get waste statistics
export const GET = async (request: Request): Promise<Response> => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const foodType = searchParams.get('foodType') as FoodType | null;

    let query = db.select().from(wasteLog);

    // Build where conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(wasteLog.wastedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(wasteLog.wastedAt, new Date(endDate)));
    }
    if (foodType) {
      const validFoodTypes: FoodType[] = ['fries', 'burger', 'soda'];
      if (validFoodTypes.includes(foodType)) {
        conditions.push(sql`${wasteLog.foodType} = ${foodType}`);
      }
    }

    // Apply conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const wasteLogs = await query.orderBy(wasteLog.wastedAt);

    // Calculate statistics
    const totalWaste = wasteLogs.reduce((sum, log) => sum + log.quantity, 0);

    const wasteByType = wasteLogs.reduce((acc, log) => {
      const type = log.foodType as FoodType;
      if (!acc[type]) {
        acc[type] = { quantity: 0, count: 0 };
      }
      acc[type].quantity += log.quantity;
      acc[type].count += 1;
      return acc;
    }, {} as Record<FoodType, { quantity: number; count: number }>);

    const wasteByReason = wasteLogs.reduce((acc, log) => {
      const reason = log.reason as WasteReason;
      if (!acc[reason]) {
        acc[reason] = { quantity: 0, count: 0 };
      }
      acc[reason].quantity += log.quantity;
      acc[reason].count += 1;
      return acc;
    }, {} as Record<WasteReason, { quantity: number; count: number }>);

    const response: FastFood['ApiResponse'] = {
      success: true,
      data: {
        logs: wasteLogs,
        statistics: {
          totalWaste,
          totalEntries: wasteLogs.length,
          byType: wasteByType,
          byReason: wasteByReason,
          dateRange: {
            start: wasteLogs.length > 0 ? wasteLogs[0].wastedAt : null,
            end: wasteLogs.length > 0 ? wasteLogs[wasteLogs.length - 1].wastedAt : null,
          },
        },
      },
    };

    return Response.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch waste statistics',
    };
    return Response.json(response, { status: 500 });
  }
};

// POST /api/waste - Log waste
export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { foodType, quantity, reason } = body as {
      foodType: FoodType;
      quantity: number;
      reason: WasteReason;
    };

    // Validate request
    if (!foodType || !quantity || quantity <= 0 || !reason) {
      const response = {
        success: false,
        error: 'Invalid request: foodType, positive quantity, and reason are required',
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

    // Validate reason
    const validReasons: WasteReason[] = ['expired', 'cancelled', 'mistake'];
    if (!validReasons.includes(reason)) {
      const response = {
        success: false,
        error: 'Invalid reason. Must be one of: ' + validReasons.join(', '),
      };
      return Response.json(response, { status: 400 });
    }

    const wasteEntry: InferInsertModel<typeof wasteLog> = {
      foodType,
      quantity,
      reason,
    };

    const [newWasteLog] = await db
      .insert(wasteLog)
      .values(wasteEntry)
      .returning();

    const response = {
      success: true,
      data: newWasteLog,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log waste',
    };
    return Response.json(response, { status: 500 });
  }
};