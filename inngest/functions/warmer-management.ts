import type { WarmerItemAddEvent, WarmerItemRemoveEvent } from '@/inngest/client';
import { inngest } from '@/inngest/client';
// TODO: Import these when implementing the exercise
// import { db } from '@/db';
// import { foodWarmer, orderItems, orders, wasteLog } from '@/db/schema';
// import { eq, and, sql } from 'drizzle-orm';
// import type { InferInsertModel } from 'drizzle-orm';
// import { FOOD_CONFIG } from '@/lib/constants';

export const warmerManagement = inngest.createFunction(
  {
    id: 'warmer-management',
    name: 'Manage Food Warmer Operations',
    concurrency: {
      limit: 1, // Process warmer operations one at a time
    },
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ event, step }) => {
    // TODO: Workshop Exercise - Implement warmer management logic
    // This function handles two events: 'warmer.item.add' and 'warmer.item.remove'
    
    if (event.name === 'warmer.item.add') {
      const { foodType, expiresAt } = event.data as WarmerItemAddEvent['data'];
      // Note: orderId and batchId are also available in event.data
      
      // TODO: Implement 'warmer.item.add' logic
      
      // Step 1: Check if food should go directly to order
      // - Use step.run('check-order-needs', async () => { ... })
      // - Query orderItems table to check if this order needs this food type
      // - If the order already has enough of this food type on tray, continue to warmer
      // - If order needs this food:
      //   - Send 'order.item.placed' event with:
      //     - orderId, foodType, quantity: 1, warmerId: undefined
      //   - Return early (don't add to warmer)
      
      // Step 2: Look up shelf life for the food type
      // - Use FOOD_CONFIG[foodType].shelfLife
      // - Calculate how long until expiration (expiresAt - now)
      
      // Step 3: Add food item to warmer
      // - Use step.run('add-to-warmer', async () => { ... })
      // - Insert into foodWarmer table with:
      //   - foodType
      //   - expiresAt: new Date(expiresAt)
      // - Return the created warmer item
      
      // Step 4: Sleep until expiration
      // - Calculate delay in milliseconds
      // - Use step.sleep(`expire-${warmerId}`, delayMs)
      
      // Step 5: After sleep, remove expired item
      // - Use step.run('expire-item', async () => { ... })
      // - Check if item still exists in warmer (it might have been used)
      // - If it exists:
      //   - Delete from foodWarmer table
      //   - Insert into wasteLog table with:
      //     - foodType
      //     - quantity: 1 (always one item)
      //     - reason: 'expired'
      //   - Send 'food.expired' event
      
      // Note: Always include a name parameter when using step.sendEvent:
      // await step.sendEvent('Send event-name event', {
      //   name: 'event.name',
      //   data: { ... }
      // });
      
      return {
        action: 'added',
        warmerId: 0, // Replace with actual warmerId
        foodType,
        expiresAt,
      };
    } else {
      // Handle warmer.item.remove
      const { warmerId, orderId, foodType, quantity } = event.data as WarmerItemRemoveEvent['data'];
      
      // TODO: Implement 'warmer.item.remove' logic
      
      // Step 1: Check if requested food exists in warmer
      // - Use step.run('check-warmer-stock', async () => { ... })
      // - Query foodWarmer table by warmerId
      // - If not found, throw an error to trigger Inngest retry:
      //   throw new Error(`Warmer item ${warmerId} not found`);
      // - This allows the system to retry after 4 seconds when food might be ready
      
      // Step 2: Remove food from warmer
      // - Use step.run('remove-from-warmer', async () => { ... })
      // - Delete the warmer item (each row = one item)
      // - Return the removed item details
      
      // Step 3: Dispatch event for order fulfillment
      // - Send 'order.item.placed' event with:
      //   - orderId
      //   - foodType
      //   - quantity
      //   - warmerId (the ID of the item removed from warmer)
      // - This event will be handled by fulfill-order function
      // - That function will handle tray updates and order completion
      
      return {
        action: 'removed',
        warmerId,
        foodType,
        quantity,
        orderId,
      };
    }
  }
);