import { inngest } from '@/inngest/client';
import { db } from '@/db';
import { orderItems, orders, foodWarmer } from '@/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';

export const fulfillOrder = inngest.createFunction(
  {
    id: 'fulfill-order',
    name: 'Handle Order Item Placement and Fulfillment',
  },
  { event: 'order.item.placed' },
  async ({ event, step }) => {
    const { orderId, foodType, quantity } = event.data;

    // Step 1: Update order tray
    const updatedOrderItem = await step.run('update-order-tray', async () => {
      const [updated] = await db
        .update(orderItems)
        .set({
          placedOnTray: sql`${orderItems.placedOnTray} + ${quantity}`,
        })
        .where(
          and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.foodType, foodType)
          )
        )
        .returning();

      return updated ?? null;
    });

    // If order item doesn't exist, order was likely cancelled
    if (!updatedOrderItem) {
      return {
        orderId,
        foodType,
        quantity,
        itemPlaced: false,
        orderComplete: false,
        reason: 'Order item not found (possibly cancelled)',
      };
    }

    // Step 2: Check if this food type is complete
    const isFoodTypeComplete = updatedOrderItem.placedOnTray >= updatedOrderItem.quantity;

    if (!isFoodTypeComplete) {
      // Food type is not complete yet, return early
      return {
        orderId,
        foodType,
        quantity,
        itemPlaced: true,
        orderComplete: false,
      };
    }

    // Step 3: Check if entire order is complete
    const isOrderComplete = await step.run('check-order-complete', async () => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Check if all items have placedOnTray >= quantity
      return items.every(item => item.placedOnTray >= item.quantity);
    });

    if (!isOrderComplete) {
      // Order is not complete yet, return early
      return {
        orderId,
        foodType,
        quantity,
        itemPlaced: true,
        orderComplete: false,
      };
    }

    // Step 4: Mark order as ready
    await step.run('mark-order-ready', async () => {
      await db
        .update(orders)
        .set({
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });

    // Step 5: Send completion notification (optional)
    console.log(`Order ${orderId} is now ready!`);

    return {
      orderId,
      foodType,
      quantity,
      itemPlaced: true,
      orderComplete: true,
    };
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
    const pendingOrders = await step.run('find-pending-orders', async () => {
      // Get all order items that need this food type
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.foodType, foodType))
        .orderBy(orderItems.id); // FIFO by creation order

      // Filter to items that still need food
      return items.filter(item => item.placedOnTray < item.quantity);
    });

    if (pendingOrders.length === 0) {
      return { foodType, matched: 0, message: 'No pending orders need this food' };
    }

    // Step 2: Get available warmer inventory for this food type
    const warmerItems = await step.run('get-warmer-inventory', async () => {
      return await db
        .select()
        .from(foodWarmer)
        .where(
          and(
            eq(foodWarmer.foodType, foodType),
            gte(foodWarmer.expiresAt, new Date())
          )
        )
        .orderBy(foodWarmer.expiresAt); // FIFO - oldest first
    });

    if (warmerItems.length === 0) {
      return { foodType, matched: 0, message: 'No items available in warmer' };
    }

    // Step 3: Match inventory to orders (FIFO for both)
    let warmerIndex = 0;

    for (const orderItem of pendingOrders) {
      const needed = orderItem.quantity - orderItem.placedOnTray;

      for (let i = 0; i < needed && warmerIndex < warmerItems.length; i++) {
        const warmerItem = warmerItems[warmerIndex];
        warmerIndex++;

        // Send event to remove from warmer and add to order
        await step.sendEvent(`Allocate ${foodType} to order ${orderItem.orderId}`, {
          name: 'warmer.item.remove',
          data: {
            warmerId: warmerItem.id,
            orderId: orderItem.orderId,
            foodType,
            quantity: 1,
          },
        });
      }

      if (warmerIndex >= warmerItems.length) {
        break; // No more items in warmer
      }
    }

    return {
      foodType,
      matched: warmerIndex,
      pendingOrdersCount: pendingOrders.length,
    };
  }
);