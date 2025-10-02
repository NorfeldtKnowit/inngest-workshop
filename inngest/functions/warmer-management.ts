/* eslint-disable @typescript-eslint/no-unused-vars */
import type { WarmerItemAddEvent, WarmerItemRemoveEvent } from '@/inngest/client';
import { inngest } from '@/inngest/client';
// import { db } from '@/db';
// import { foodWarmer, wasteLog } from '@/db/schema';
// import { eq } from 'drizzle-orm';
// import type { InferInsertModel } from 'drizzle-orm';

export const warmerManagement = inngest.createFunction(
  {
    id: 'warmer-management',
    name: 'Manage Food Warmer Operations',
    retries: 3, // Retry up to 3 times if food not available
     
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
      // TODO: Create a step.run() named 'add-to-warmer'
      // - Insert a new record into the foodWarmer table
      // - Set foodType and expiresAt (use expirationDate variable)
      // - Use .returning() to get the created item
      // - Return the item
      // - Store the result in a variable called warmerItem
      // Hint: Use db.insert(foodWarmer).values({...}).returning()

      // Step 3: Notify that warmer inventory changed
      // TODO: Create a step.run() named 'get-warmer-count'
      // - Query the foodWarmer table for all items of this foodType
      // - Count the items (using .length on the result array)
      // - Return the count
      // - Store the result in a variable called totalCount
      // Hint: Use db.select().from(foodWarmer).where(eq(foodWarmer.foodType, foodType))

      // TODO: Send a 'warmer.inventory.changed' event
      // - Use step.sendEvent() with description 'Notify inventory changed'
      // - Include foodType and totalCount in the event data

      // Step 4: Sleep until expiration
      // TODO: Use step.sleep() to wait until the item expires
      // - Name the sleep step using the pattern: `expire-${warmerItem.id}`
      // - Pass the delay variable as the duration

      // Step 5: After sleep, check and remove expired item
      // TODO: Create a step.run() named 'expire-item'
      // - Check if the warmer item still exists (it might have been used already)
      // - If it exists:
      //   1. Delete it from the foodWarmer table
      //   2. Insert a record into the wasteLog table with: foodType, quantity: 1, reason: 'expired'
      //   3. Return true
      // - If it doesn't exist, return false
      // - Store the result in a variable called itemStillExists
      // Hint: Query where eq(foodWarmer.id, warmerItem.id)

      // TODO: Send 'food.expired' event (ONLY if itemStillExists is true)
      // - Use step.sendEvent() with description 'Send food expired event'
      // - Include: warmerId (warmerItem.id), foodType, quantity: 1, reason: 'expired'

      // TODO: Return an object with:
      // - action: 'added' (use 'as const')
      // - warmerId: warmerItem.id
      // - foodType
      // - expiresAt
    } else {
      // Handle warmer.item.remove
      const { warmerId, orderId, foodType, quantity } = event.data as WarmerItemRemoveEvent['data'];

      // Step 1: Check if requested food exists in warmer
      // TODO: Create a step.run() named 'check-warmer-stock'
      // - Query the foodWarmer table for the item with this warmerId
      // - Use eq(foodWarmer.id, warmerId) to filter
      // - Return the item if found, or null if not found
      // - Store the result in a variable called item
      // Hint: Use db.select().from(foodWarmer).where(...)

      // If item doesn't exist, it was already used or expired
      // TODO: Add an if statement to check if item is null
      // - If null, return an object with:
      //   - action: 'skipped' (use 'as const')
      //   - warmerId
      //   - foodType
      //   - reason: 'Item already used or expired'

      // Step 2: Remove food from warmer
      // TODO: Create a step.run() named 'remove-from-warmer'
      // - Delete the item from the foodWarmer table
      // - Use eq(foodWarmer.id, warmerId) to target the specific item
      // Hint: Use db.delete(foodWarmer).where(...)

      // Step 3: Dispatch event for order fulfillment
      // TODO: Send an 'order.item.placed' event
      // - Use step.sendEvent() with description 'Send order item placed event'
      // - Include: orderId, foodType, quantity, warmerId

      // TODO: Return an object with:
      // - action: 'removed' (use 'as const')
      // - warmerId
      // - foodType
      // - quantity
      // - orderId
    }
  }
);