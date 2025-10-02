import type { OrderCreatedEvent } from '@/inngest/client';
import { FOOD_CONFIG } from '@/lib/constants';
import { expect, test } from '@playwright/test';

// Time buffer for completion overhead (DB updates, events, UI polling)
const COMPLETION_OVERHEAD = 1500; // ms

test.describe('Exercise 3: Order Fulfillment', () => {
  test.beforeEach(async ({ page }) => {
    // Reset the database before each test
    const response = await page.request.post('http://localhost:3000/api/dev/reset', {
      data: { seed: false },
    });
    expect(response.ok()).toBeTruthy();

    // Wait for any sleeping warmer-management instances to complete from previous tests
    await page.waitForTimeout(FOOD_CONFIG.burger.shelfLife + COMPLETION_OVERHEAD);

    // Navigate to the kitchen dashboard
    await page.goto('http://localhost:3000/kitchen');
    await expect(page).toHaveTitle(/Fastfood Workshop/i);
  });

  test('SMOKE: can find ready order in UI', async ({ page }) => {
    // 1. Create order directly via API
    const orderRes = await page.request.post('http://localhost:3000/api/orders', {
      data: {
        customerName: 'Smoke Test',
        tableNumber: 99,
        items: [
          { foodType: 'burger', quantity: 1 }
        ]
      }
    });
    const orderJson = await orderRes.json();
    const orderId = orderJson.data.id;

    // 2. Update order status to 'ready' and placedOnTray via database
    await page.request.put(`http://localhost:3000/api/orders/${orderId}/status`, {
      data: { status: 'ready' }
    });

    // Mark item as placed (this might not exist, but let's try)
    const order = orderJson.data;
    const itemId = order.items[0].id;
    try {
      await page.request.put(`http://localhost:3000/api/orders/${orderId}/items/${itemId}/place`, {
        data: { quantity: 1 }
      });
    } catch {
      // Endpoint might not exist, continue
    }

    // 3. Verify we can find the ready badge in UI (search whole page for simplicity)
    await expect(async () => {
      const statusBadge = page.getByText(/ready/i).first();
      await expect(statusBadge).toBeVisible();
    }).toPass({ timeout: 3000 });
  });

  test('should complete simple order and mark as ready', async ({ page }) => {
    // 1. Trigger order event (1 burger)
    const eventData = {
      orderId: 1,
      customerName: 'Test Customer',
      tableNumber: 1,
      items: [
        { foodType: 'burger' as const, quantity: 1 },
      ],
    } satisfies OrderCreatedEvent['data'];

    await page.request.post('http://localhost:3000/api/events/order', {
      data: eventData
    });

    // 2. Wait for complete workflow: prep + Inngest processing + debounce + matching
    // Use prep time + completion overhead as generous timeout
    const totalTimeout = FOOD_CONFIG.burger.prepTime + FOOD_CONFIG.burger.shelfLife;
    await page.waitForTimeout(totalTimeout);

    // 3. First verify order was created
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/orders');
      const json = await res.json();
      return json.data?.some((o: { id: number }) => o.id === 1);
    }, { timeout: 5000 }).toBeTruthy();

    // 4. Assert database: order status = 'ready', placedOnTray = 1
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/orders');
      const json = await res.json();
      const order = json.data?.find((o: { id: number }) => o.id === 1);
      return order?.status;
    }, { timeout: 10000 }).toBe('ready');

    // 5. Assert UI: Order card shows "ready" badge (wait for React Query to update)
    await expect(async () => {
      const statusBadge = page.getByText(/ready/i).first();
      await expect(statusBadge).toBeVisible();
    }).toPass({ timeout: 3000 });

    // 6. Assert UI: Item shows 1/1 (complete)
    await expect(async () => {
      const burgerItem = page.getByText('1/1');
      await expect(burgerItem).toBeVisible();
    }).toPass({ timeout: 3000 });
  });

  test('should complete multi-item order', async ({ page }) => {
    // 1. Trigger order with burger and fries
    const eventData = {
      orderId: 2,
      customerName: 'Test Customer',
      tableNumber: 2,
      items: [
        { foodType: 'burger' as const, quantity: 1 },
        { foodType: 'fries' as const, quantity: 1 },
      ],
    } satisfies OrderCreatedEvent['data'];

    await page.request.post('http://localhost:3000/api/events/order', {
      data: eventData
    });

    // 2. Wait for both preparations to complete (burger takes longer)
    const totalTimeout = FOOD_CONFIG.burger.prepTime + FOOD_CONFIG.burger.shelfLife;
    await page.waitForTimeout(totalTimeout);

    // 3. Assert database: order status = 'ready', both items complete
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/orders');
      const json = await res.json();
      const order = json.data?.find((o: { id: number }) => o.id === 2);
      return order?.status;
    }, { timeout: 5000 }).toBe('ready');

    // 4. Assert UI: Order shows ready status (wait for React Query to update)
    await expect(async () => {
      const statusBadge = page.getByText(/ready/i).first();
      await expect(statusBadge).toBeVisible();
    }).toPass({ timeout: 3000 });
  });

});
