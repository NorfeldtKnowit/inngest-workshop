import type { OrderCreatedEvent } from '@/inngest/client';
import { FOOD_CONFIG } from '@/lib/constants';
import { expect, test } from '@playwright/test';

// Time buffer for preparation completion overhead
// Accounts for: DB updates, event sending, event propagation, UI polling and NOT the actual prep time
const PREP_COMPLETION_OVERHEAD = 1500 // ms

test.describe('Exercise 1: Food Preparation', () => {
  test.beforeEach(async ({ page }) => {
    // Reset the database before each test
    const response = await page.request.post('http://localhost:3000/api/dev/reset', {
      data: { seed: false },
    });
    expect(response.ok()).toBeTruthy();

    // Navigate to the kitchen dashboard
    await page.goto('http://localhost:3000/kitchen');
    await expect(page).toHaveTitle(/Fastfood Workshop/i);
  });

  test('should prepare food when order is created', async ({ page }) => {
    // 1. Trigger an order event
    const eventData = {
      orderId: 1,
      customerName: 'Test Customer',
      tableNumber: 1,
      items: [
        { foodType: 'burger' as const, quantity: 1 },
        { foodType: 'fries' as const, quantity: 2 },
      ],
    } satisfies OrderCreatedEvent['data'];

    const response = await page.request.post('http://localhost:3000/api/events/order', {
      data: eventData
    });
    expect(response.ok()).toBeTruthy();

    // 2. Verify preparation started in database (with auto-retry)
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/preparations');
      const json = await res.json();
      return json.data?.some((p: { foodType: string }) => p.foodType === 'burger');
    }, { timeout: 2000 }).toBeTruthy();

    // 3. Verify preparations card appears in UI
    const preparationCardBurgers = page.locator('text=Burger Batch').first();
    const preparationCardFries = page.locator('text=Fries Batch').first();
    
    await expect(preparationCardBurgers).toBeVisible();
    await expect(preparationCardFries).toBeVisible();

    // 4. Verify both preparation cards get removed after completion
    // Each food type has its own timeout based on prep time
    await Promise.all([
      expect(async () => {
        await expect(preparationCardFries).not.toBeVisible();
      }).toPass({ timeout: FOOD_CONFIG.fries.prepTime + PREP_COMPLETION_OVERHEAD }),

      expect(async () => {
        await expect(preparationCardBurgers).not.toBeVisible();
      }).toPass({ timeout: FOOD_CONFIG.burger.prepTime + PREP_COMPLETION_OVERHEAD })
    ]);
  });
});
