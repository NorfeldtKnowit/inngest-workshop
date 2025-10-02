import { inngest } from '@/inngest/client';
import { db } from '@/db';
import { activePreparations } from '@/db/schema';
import { FOOD_CONFIG } from '@/lib/constants';
import type { InferInsertModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

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
      await db
        .update(activePreparations)
        .set({ status: 'ready' })
        .where(eq(activePreparations.id, preparation.id));
    });

    // Step 5: Dispatch events to add food to the warmer
    const expiresAt = new Date(Date.now() + foodConfig.shelfLife).toISOString();

    for (let i = 0; i < quantity; i++) {
      await step.sendEvent(`Add item ${i + 1} to warmer`, {
        name: 'warmer.item.add',
        data: {
          foodType,
          orderId,
          batchId,
          expiresAt,
        },
      });
    }

    // Step 6: Remove from active preparations
    await step.run('remove-preparation', async () => {
      await db
        .delete(activePreparations)
        .where(eq(activePreparations.id, preparation.id));
    });

    // Return the result
    return {
      preparationId: preparation.id,
      foodType,
      quantity,
      batchId,
      prepTime,
      status: 'completed' as const,
    };
  }
);