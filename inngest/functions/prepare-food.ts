/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from '@/db';
import { activePreparations } from '@/db/schema';
import { inngest } from '@/inngest/client';
import { FOOD_CONFIG } from '@/lib/constants';
import type { InferInsertModel } from 'drizzle-orm';
// import { eq } from 'drizzle-orm';

export const prepareFood = inngest.createFunction(
  {
    id: 'prepare-food',
    name: 'Prepare Food Items',
    concurrency: {
      limit: 5, // Limit concurrent preparations
      key: 'event.data.foodType', // One preparation per food type at a time
    },
  },
  { event: 'food.prepare' },
  async ({ event, step }) => {
    const { foodType, quantity, batchId, orderId } = event.data;

    // Step 1: Get food configuration
    const foodConfig = FOOD_CONFIG[foodType];
    const prepTime = foodConfig.prepTime;

    // Step 2: Create active preparation record
    const preparation = await step.run('create-preparation', async () => {
      const now = new Date();
      const completesAt = new Date(now.getTime() + prepTime);

      const [record] = await db
        .insert(activePreparations)
        .values({
          foodType,
          quantity,
          status: 'preparing',
          startedAt: now,
          completesAt,
        } satisfies InferInsertModel<typeof activePreparations>)
        .returning();

      return record;
    });

    // Step 3: Simulate cooking time
    await step.sleep('cooking', prepTime);

    // Step 4: Mark preparation as ready
    await step.run('mark-preparation-ready', async () => {
      // TODO: Update the activePreparations table
      // - Set the status field to 'ready'
      // - Update only the record where activePreparations.id equals preparation.id
      // Hint: Use db.update(activePreparations).set({...}).where(...)
    });

    // Step 5: Dispatch events to add food to the warmer
    // TODO: Calculate when the food items will expire
    // - Use the foodConfig.shelfLife to determine expiration time
    // - Create an ISO string for the expiresAt timestamp
    // - Store it in a variable called expiresAt

    // TODO: Send warmer.item.add events for each item in the batch
    // - Loop through the quantity (for each item that was prepared)
    // - Use step.sendEvent() to send a 'warmer.item.add' event for each item
    // - Each event should include: foodType, orderId, batchId, expiresAt
    // - Give each event a unique description like "Add item 1 to warmer", "Add item 2 to warmer", etc.

    // Step 6: Remove from active preparations
    await step.run('remove-preparation', async () => {
      // TODO: Delete the preparation record from the database
      // - Delete from activePreparations table
      // - Only delete the record where activePreparations.id equals preparation.id
      // Hint: Use db.delete(activePreparations).where(...)
    });

    // TODO: Return the result object
    // Return an object with:
    // - preparationId: preparation.id
    // - foodType: the food type that was prepared
    // - quantity: number of items prepared
    // - batchId: the batch identifier
    // - prepTime: time it took to prepare
    // - status: 'completed' (use 'as const' for type safety)
  }
);