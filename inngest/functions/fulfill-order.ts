/* eslint-disable @typescript-eslint/no-unused-vars */
import { inngest } from '@/inngest/client';
// import { db } from '@/db';
// import { orderItems, orders, foodWarmer } from '@/db/schema';
// import { eq, and, sql, gte } from 'drizzle-orm';

export const fulfillOrder = inngest.createFunction(
  {
    id: 'fulfill-order',
    name: 'Handle Order Item Placement and Fulfillment',
  },
  { event: 'order.item.placed' },
  async ({ event, step }) => {
    const { orderId, foodType, quantity } = event.data;

    // Step 1: Update order tray
    // TODO: Create a step.run() named 'update-order-tray'
    // - Update the orderItems table
    // - Increment placedOnTray by the quantity (use sql`${orderItems.placedOnTray} + ${quantity}`)
    // - Filter where orderId matches AND foodType matches (use and() with eq() for both)
    // - Use .returning() to get the updated item
    // - Return the updated item, or null if not found
    // - Store the result in a variable called updatedOrderItem
    // Hint: Use db.update(orderItems).set({...}).where(and(...)).returning()

    // If order item doesn't exist, order was likely cancelled
    // TODO: Add an if statement to check if updatedOrderItem is null
    // - If null, return an object with:
    //   - orderId, foodType, quantity
    //   - itemPlaced: false
    //   - orderComplete: false
    //   - reason: 'Order item not found (possibly cancelled)'

    // Step 2: Check if this food type is complete
    // TODO: Create a variable called isFoodTypeComplete
    // - Check if updatedOrderItem.placedOnTray >= updatedOrderItem.quantity
    // - This tells us if all items of this food type have been placed

    // TODO: Add an if statement to check if !isFoodTypeComplete
    // - If the food type is not complete yet, return an object with:
    //   - orderId, foodType, quantity
    //   - itemPlaced: true
    //   - orderComplete: false

    // Step 3: Check if entire order is complete
    // TODO: Create a step.run() named 'check-order-complete'
    // - Query all orderItems for this orderId
    // - Check if ALL items have placedOnTray >= quantity (use .every())
    // - Return true if all items are complete, false otherwise
    // - Store the result in a variable called isOrderComplete

    // TODO: Add an if statement to check if !isOrderComplete
    // - If the order is not complete yet, return an object with:
    //   - orderId, foodType, quantity
    //   - itemPlaced: true
    //   - orderComplete: false

    // Step 4: Mark order as ready
    // TODO: Create a step.run() named 'mark-order-ready'
    // - Update the orders table
    // - Set status to 'ready' and updatedAt to new Date()
    // - Filter where orders.id equals orderId

    // TODO: Return an object with:
    // - orderId, foodType, quantity
    // - itemPlaced: true
    // - orderComplete: true
  }
);

// Match warmer inventory to pending orders
export const matchWarmerToOrders = inngest.createFunction(
  {
    id: 'match-warmer-to-orders',
    name: 'Match Warmer Inventory to Pending Orders',
    debounce: {
      period: '1s', // Wait for multiple items to be added before matching
      key: 'event.data.foodType', // Debounce per food type
    },
  },
  { event: 'warmer.inventory.changed' },
  async ({ event, step }) => {
    const { foodType } = event.data;

    // Step 1: Find pending orders that need this food type
    // TODO: Create a step.run() named 'find-pending-orders'
    // - Query all orderItems with this foodType
    // - Order by orderItems.id (FIFO - oldest orders first)
    // - Filter the results to only include items where placedOnTray < quantity
    // - Return the filtered array
    // - Store the result in a variable called pendingOrders
    // Hint: Use db.select().from(orderItems).where(...).orderBy(...) then .filter()

    // TODO: Add an if statement to check if pendingOrders.length === 0
    // - If no pending orders, return an object with:
    //   - foodType
    //   - matched: 0
    //   - message: 'No pending orders need this food'

    // Step 2: Get available warmer inventory for this food type
    // TODO: Create a step.run() named 'get-warmer-inventory'
    // - Query the foodWarmer table
    // - Filter where foodType matches AND expiresAt is >= new Date() (use and() with eq() and gte())
    // - Order by foodWarmer.expiresAt (FIFO - oldest items first)
    // - Return the items
    // - Store the result in a variable called warmerItems
    // Hint: Use db.select().from(foodWarmer).where(and(...)).orderBy(...)

    // TODO: Add an if statement to check if warmerItems.length === 0
    // - If no items available, return an object with:
    //   - foodType
    //   - matched: 0
    //   - message: 'No items available in warmer'

    // Step 3: Match inventory to orders (FIFO for both)
    // TODO: Create a variable called warmerIndex and set it to 0
    // - This tracks which warmer item we're allocating next

    // TODO: Loop through each orderItem in pendingOrders
    // - Calculate how many items are needed: orderItem.quantity - orderItem.placedOnTray
    // - For each needed item (while warmerIndex < warmerItems.length):
    //   1. Get the warmer item at warmerItems[warmerIndex]
    //   2. Increment warmerIndex
    //   3. Send a 'warmer.item.remove' event with:
    //      - Description: `Allocate ${foodType} to order ${orderItem.orderId}`
    //      - Data: warmerId (warmerItem.id), orderId, foodType, quantity: 1
    // - If warmerIndex reaches warmerItems.length, break out of the loop (no more items)

    // TODO: Return an object with:
    // - foodType
    // - matched: warmerIndex (total number of items matched)
    // - pendingOrdersCount: pendingOrders.length
  }
);