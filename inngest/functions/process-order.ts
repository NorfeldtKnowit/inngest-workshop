import { db } from '@/db';
import { activePreparations, foodWarmer, orderItems, orders } from '@/db/schema';
import { inngest } from '@/inngest/client';
import { FOOD_CONFIG } from '@/lib/constants';
import type { InferInsertModel } from 'drizzle-orm';
import { and, eq, gte, sql } from 'drizzle-orm';

type FoodType = 'fries' | 'burger' | 'soda';

type InventoryAnalysisItem = {
  foodType: FoodType;
  requiredQuantity: number;
  itemsToAdd: Array<{
    type: string;
    quantity: number;
    batchId: string;
    expiresAt: string;
  }>;
  itemsToRemove: Array<{
    warmerId: number;
    quantity: number;
  }>;
  itemsToPrepare: {
    quantity: number;
    batchId: string;
  } | null;
};

export const processOrder = inngest.createFunction(
  {
    id: 'process-order',
    name: 'Process New Order',
  },
  { event: 'order.created' },
  async ({ event, step }) => {
    const { orderId, customerName, tableNumber, items } = event.data;

    // Step 1: Create the order in the database
    await step.run('create-order', async () => {
      // Create order
      const orderInsert: InferInsertModel<typeof orders> = {
        id: orderId,
        customerName: customerName || 'Guest',
        tableNumber,
        status: 'pending',
      };

      const [newOrder] = await db.insert(orders).values(orderInsert).returning();

      // Create order items
      const orderItemsInsert: InferInsertModel<typeof orderItems>[] = items.map((item) => ({
        orderId: newOrder.id,
        foodType: item.foodType,
        quantity: item.quantity,
        placedOnTray: 0,
      }));

      await db.insert(orderItems).values(orderItemsInsert);

      return newOrder;
    });

    // Step 2: Update order status to preparing
    await step.run('update-order-status', async () => {
      await db
        .update(orders)
        .set({ 
          status: 'preparing',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
    });

    // Step 3: Calculate inventory needs for each food type
    const inventoryAnalysis = await step.run('analyze-inventory-needs', async () => {
      // Group items by food type
      const foodTypeQuantities = new Map<FoodType, number>();
      for (const item of items) {
        const current = foodTypeQuantities.get(item.foodType) || 0;
        foodTypeQuantities.set(item.foodType, current + item.quantity);
      }

      const analysis: InventoryAnalysisItem[] = [];

      for (const [foodType, requiredQuantity] of foodTypeQuantities) {
        // Special handling for soda - instant preparation
        if (foodType === 'soda') {
          analysis.push({
            foodType,
            requiredQuantity,
            itemsToAdd: [{
              type: 'instant',
              quantity: requiredQuantity,
              batchId: `${orderId}-${foodType}-instant`,
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            }],
            itemsToRemove: [],
            itemsToPrepare: null,
          });
          continue;
        }

        // Fetch warmer inventory and active preparations in parallel
        const [warmerItems, activePreps] = await Promise.all([
          // Check current warmer inventory
          db
            .select({
              id: foodWarmer.id,
              expiresAt: foodWarmer.expiresAt,
            })
            .from(foodWarmer)
            .where(
              and(
                eq(foodWarmer.foodType, foodType),
                gte(foodWarmer.expiresAt, new Date())
              )
            )
            .orderBy(foodWarmer.expiresAt),
          // Check active preparations
          db
            .select({
              quantity: sql<number>`SUM(${activePreparations.quantity})`.as('quantity')
            })
            .from(activePreparations)
            .where(
              and(
                eq(activePreparations.foodType, foodType),
                eq(activePreparations.status, 'preparing')
              )
            )
        ]);

        const beingPrepared = activePreps[0]?.quantity || 0;

        // Simple calculation: Always remove what we can from warmer (each row = 1 item)
        const itemsToRemove: Array<{ warmerId: number; quantity: number }> = [];
        let takenFromWarmer = 0;
        
        for (const warmerItem of warmerItems) {
          if (takenFromWarmer >= requiredQuantity) break;
          
          // Each warmer item row represents 1 item
          itemsToRemove.push({
            warmerId: warmerItem.id,
            quantity: 1, // Always 1 since each row = 1 item
          });
          takenFromWarmer += 1;
        }

        // Calculate if we need to prepare more
        const totalInWarmer = warmerItems.length; // Count of rows = total items
        const totalAvailable = totalInWarmer + beingPrepared;
        
        let itemsToPrepare: { quantity: number; batchId: string } | null = null;
        
        if (requiredQuantity > totalAvailable) {
          // Need to prepare more
          const config = FOOD_CONFIG[foodType];
          const batchSize = config.batchSize;
          const needToPrepare = requiredQuantity - totalAvailable;
          const batchesToPrepare = Math.ceil(needToPrepare / batchSize);
          const quantityToPrepare = batchesToPrepare * batchSize;
          
          itemsToPrepare = {
            quantity: quantityToPrepare,
            batchId: `${orderId}-${foodType}-${Date.now()}`,
          };
        }

        analysis.push({
          foodType,
          requiredQuantity,
          itemsToAdd: [],
          itemsToRemove,
          itemsToPrepare,
        });

        // TODO: Workshop Exercise - Parallel orders could conflict with each other and cause not enough food to be prepared. 
        // Investiage how inngest might help with this (hint: 'concurrency' + 'debounce' + step.invoke)
      }

      return analysis;
    });

    // Step 4: Send events based on inventory analysis

    for (const item of inventoryAnalysis) {
      // TODO: Workshop Exercise - Handle instant items (sodas) properly
      // Instant items like sodas are SHOULD NOT be added to the warmer.
      // Instead, they should be added directly to the order.
      // 
      // Tasks:
      // 1. Create a new event type 'instant.item.add' in the Inngest client
      // 2. Build an Inngest function that reacts to 'instant.item.add' events
      // 3. The function should add instant items directly to the order

      // Send warmer removal events
      for (const removeItem of item.itemsToRemove) {
        await step.sendEvent('Send remove-warmer-item event', {
          name: 'warmer.item.remove',
          data: {
            warmerId: removeItem.warmerId,
            orderId,
            foodType: item.foodType,
            quantity: removeItem.quantity,
          }
        });
      }

      // Send prepare event if needed
      if (item.itemsToPrepare) {
        await step.sendEvent('Send prepare-food event', {
          name: 'food.prepare',
          data: {
            foodType: item.foodType,
            quantity: item.itemsToPrepare.quantity,
            orderId,
            batchId: item.itemsToPrepare.batchId,
          }
        });
      }
    }

    return {
      orderId,
      status: 'processing',
      itemsToProcess: items,
      inventoryAnalysis,
    };
  }
);