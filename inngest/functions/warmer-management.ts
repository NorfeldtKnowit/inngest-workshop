import type { WarmerItemAddEvent, WarmerItemRemoveEvent } from '@/inngest/client';
import { inngest } from '@/inngest/client';
import { db } from '@/db';
import { foodWarmer, wasteLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';

export const warmerManagement = inngest.createFunction(
  {
    id: 'warmer-management',
    name: 'Manage Food Warmer Operations',
    retries: 3, // Retry up to 3 times if food not available
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onFailure: async ({ error, event, step }) => {
      // TODO: Workshop Bonus Exercise - Self-Healing System
      // 
      // This onFailure handler is called AFTER all retries have been exhausted.
      // It's a perfect place to implement self-healing behavior.
      //
      // For a self-healing kitchen system, you could:
      // 1. Check if the failed event was 'warmer.item.remove'
      // 2. If it failed because food wasn't available (even after retries),
      //    dispatch a 'food.prepare' event to automatically prepare more
      //
      // This creates a resilient system that automatically recovers from
      // food shortages without manual intervention!
    },
  },
  [
    { event: 'warmer.item.add' },
    { event: 'warmer.item.remove' }
  ],
  async ({ event, step }) => {
    if (event.name === 'warmer.item.add') {
      const { foodType, expiresAt } = event.data as WarmerItemAddEvent['data'];

      // Step 1: Calculate expiration delay
      const expirationDate = new Date(expiresAt);
      const delay = Math.max(0, expirationDate.getTime() - Date.now()); // Ensure non-negative

      // Step 2: Add food item to warmer
      const warmerItem = await step.run('add-to-warmer', async () => {
        const [item] = await db
          .insert(foodWarmer)
          .values({
            foodType,
            expiresAt: expirationDate,
          } satisfies InferInsertModel<typeof foodWarmer>)
          .returning();

        return item;
      });

      // Step 3: Notify that warmer inventory changed
      const totalCount = await step.run('get-warmer-count', async () => {
        const items = await db
          .select()
          .from(foodWarmer)
          .where(eq(foodWarmer.foodType, foodType));

        return items.length;
      });

      await step.sendEvent('Notify inventory changed', {
        name: 'warmer.inventory.changed',
        data: {
          foodType,
          totalCount,
        },
      });

      // Step 4: Sleep until expiration
      await step.sleep(`expire-${warmerItem.id}`, delay);

      // Step 5: After sleep, check and remove expired item
      const itemStillExists = await step.run('expire-item', async () => {
        // Check if item still exists in warmer (it might have been used)
        const [existingItem] = await db
          .select()
          .from(foodWarmer)
          .where(eq(foodWarmer.id, warmerItem.id));

        if (existingItem) {
          // Delete from foodWarmer table
          await db
            .delete(foodWarmer)
            .where(eq(foodWarmer.id, warmerItem.id));

          // Insert into wasteLog table
          await db
            .insert(wasteLog)
            .values({
              foodType,
              quantity: 1,
              reason: 'expired',
            } satisfies InferInsertModel<typeof wasteLog>);

          return true; // Item was removed
        }

        return false; // Item was already used
      });

      // Send 'food.expired' event outside step.run
      if (itemStillExists) {
        await step.sendEvent('Send food expired event', {
          name: 'food.expired',
          data: {
            warmerId: warmerItem.id,
            foodType,
            quantity: 1,
            reason: 'expired',
          },
        });
      }

      return {
        action: 'added' as const,
        warmerId: warmerItem.id,
        foodType,
        expiresAt,
      };
    } else {
      // Handle warmer.item.remove
      const { warmerId, orderId, foodType, quantity } = event.data as WarmerItemRemoveEvent['data'];

      // Step 1: Check if requested food exists in warmer
      const item = await step.run('check-warmer-stock', async () => {
        const [item] = await db
          .select()
          .from(foodWarmer)
          .where(eq(foodWarmer.id, warmerId));

        return item ?? null;
      });

      // If item doesn't exist, it was already used or expired
      if (!item) {
        return {
          action: 'skipped' as const,
          warmerId,
          foodType,
          reason: 'Item already used or expired',
        };
      }

      // Step 2: Remove food from warmer
      await step.run('remove-from-warmer', async () => {
        await db
          .delete(foodWarmer)
          .where(eq(foodWarmer.id, warmerId));
      });

      // Step 3: Dispatch event for order fulfillment
      await step.sendEvent('Send order item placed event', {
        name: 'order.item.placed',
        data: {
          orderId,
          foodType,
          quantity,
          warmerId,
        },
      });

      return {
        action: 'removed' as const,
        warmerId,
        foodType,
        quantity,
        orderId,
      };
    }
  }
);