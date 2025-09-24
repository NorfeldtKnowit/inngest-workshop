import { db } from '@/db';
import { orders, orderItems, foodWarmer, wasteLog, activePreparations } from '@/db/schema';
import { FOOD_CONFIG } from '@/lib/constants';
import type { InferInsertModel } from 'drizzle-orm';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ResetStats = {
  cleared: {
    orders: number;
    orderItems: number;
    foodWarmer: number;
    wasteLog: number;
    activePreparations: number;
  };
  seeded?: {
    orders: number;
    orderItems: number;
    foodWarmer: number;
  };
};

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json().catch(() => ({ seed: false }));
    const shouldSeed = body.seed === true;

    // Count existing records before clearing
    const existingOrders = db.select().from(orders).all();
    const existingOrderItems = db.select().from(orderItems).all();
    const existingFoodWarmer = db.select().from(foodWarmer).all();
    const existingWasteLog = db.select().from(wasteLog).all();
    const existingActivePreparations = db.select().from(activePreparations).all();

    // Clear all tables
    db.delete(orderItems).run();
    db.delete(orders).run();
    db.delete(foodWarmer).run();
    db.delete(wasteLog).run();
    db.delete(activePreparations).run();

    const stats: ResetStats = {
      cleared: {
        orders: existingOrders.length,
        orderItems: existingOrderItems.length,
        foodWarmer: existingFoodWarmer.length,
        wasteLog: existingWasteLog.length,
        activePreparations: existingActivePreparations.length,
      },
    };

    // Optionally seed with sample data
    if (shouldSeed) {
      // Create sample orders
      const sampleOrders = [
        {
          tableNumber: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          tableNumber: 3,
          status: 'preparing',
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          updatedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        },
      ] satisfies InferInsertModel<typeof orders>[];

      const insertedOrders = sampleOrders.map(order => 
        db.insert(orders).values(order).returning().get()
      );

      // Create sample order items
      const sampleItems = [
        // Alice's order
        { orderId: insertedOrders[0].id, foodType: 'burger', quantity: 2 },
        { orderId: insertedOrders[0].id, foodType: 'fries', quantity: 1 },
        { orderId: insertedOrders[0].id, foodType: 'soda', quantity: 2 },
        // Bob's order
        { orderId: insertedOrders[1].id, foodType: 'fries', quantity: 2 },
        { orderId: insertedOrders[1].id, foodType: 'soda', quantity: 1 },
      ] satisfies InferInsertModel<typeof orderItems>[];

      sampleItems.forEach(item =>
        db.insert(orderItems).values(item).run()
      );

      // Add some items to food warmer
      const now = Date.now();
      const warmerItems = [
        {
          foodType: 'fries',
          quantity: 4,
          expiresAt: new Date(now + FOOD_CONFIG.fries.shelfLife),
          createdAt: new Date(),
        },
        {
          foodType: 'burger',
          quantity: 2,
          expiresAt: new Date(now + FOOD_CONFIG.burger.shelfLife),
          createdAt: new Date(),
        },
        {
          foodType: 'soda',
          quantity: 10,
          expiresAt: new Date(now + 24 * 60 * 60 * 1000), // 24 hours
          createdAt: new Date(),
        },
      ] satisfies InferInsertModel<typeof foodWarmer>[];

      warmerItems.forEach(item =>
        db.insert(foodWarmer).values(item).run()
      );

      stats.seeded = {
        orders: insertedOrders.length,
        orderItems: sampleItems.length,
        foodWarmer: warmerItems.length,
      };
    }

    const response: ApiResponse<ResetStats> = {
      success: true,
      data: stats,
    };

    return Response.json(response);
  } catch (error) {
    console.error('Reset error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset database',
    };
    return Response.json(response, { status: 500 });
  }
};

// GET endpoint to check current counts
export const GET = async (): Promise<Response> => {
  try {
    const orderCount = db.select().from(orders).all().length;
    const orderItemCount = db.select().from(orderItems).all().length;
    const foodWarmerCount = db.select().from(foodWarmer).all().length;
    const wasteLogCount = db.select().from(wasteLog).all().length;
    const activePreparationsCount = db.select().from(activePreparations).all().length;

    const response: ApiResponse<ResetStats['cleared']> = {
      success: true,
      data: {
        orders: orderCount,
        orderItems: orderItemCount,
        foodWarmer: foodWarmerCount,
        wasteLog: wasteLogCount,
        activePreparations: activePreparationsCount,
      },
    };

    return Response.json(response);
  } catch (error) {
    console.error('Count error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get counts',
    };
    return Response.json(response, { status: 500 });
  }
};