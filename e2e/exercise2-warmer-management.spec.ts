import type { OrderCreatedEvent } from '@/inngest/client';
import { FOOD_CONFIG } from '@/lib/constants';
import { expect, test } from '@playwright/test';

// Time buffer for completion overhead (DB updates, events, UI polling)
const COMPLETION_OVERHEAD = 1500; // ms

test.describe('Exercise 2: Warmer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Reset the database before each test
    const response = await page.request.post('http://localhost:3000/api/dev/reset', {
      data: { seed: false },
    });
    expect(response.ok()).toBeTruthy();

    // Wait for any sleeping warmer-management instances to complete from previous tests
    // Burger has longest shelf life (10s) + completion overhead
    await page.waitForTimeout(FOOD_CONFIG.burger.shelfLife + COMPLETION_OVERHEAD);

    // Navigate to the kitchen dashboard
    await page.goto('http://localhost:3000/kitchen');
    await expect(page).toHaveTitle(/Fastfood Workshop/i);
  });

  test('should add prepared food to warmer after cooking completes', async ({ page }) => {
    // 1. Trigger an order event (starts the workflow)
    const eventData = {
      orderId: 1,
      customerName: 'Test Customer',
      tableNumber: 1,
      items: [
        { foodType: 'burger' as const, quantity: 1 },
      ],
    } satisfies OrderCreatedEvent['data'];

    const response = await page.request.post('http://localhost:3000/api/events/order', {
      data: eventData
    });
    expect(response.ok()).toBeTruthy();

    // 2. Wait for preparation to complete
    const prepTimeout = FOOD_CONFIG.burger.prepTime + COMPLETION_OVERHEAD;
    await page.waitForTimeout(prepTimeout);

    // 3. Verify items added to warmer database (batch size = 5)
    // Increased timeout to account for debounced matching
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/foodwarmer');
      const json = await res.json();
      return json.data?.inventory?.filter((item: { foodType: string }) => item.foodType === 'burger').length;
    }, { timeout: 5000 }).toBe(FOOD_CONFIG.burger.batchSize);

    // 4. Verify warmer cards appear in UI
    const freshItemsSection = page.getByRole('heading', { name: /Fresh Items/i }).locator('..');
    const burgerCard = freshItemsSection.getByText('🍔').first();
    await expect(burgerCard).toBeVisible();

    // 5. Verify progress bar exists within fresh items section
    const progressBar = freshItemsSection.getByRole('progressbar').first();
    await expect(progressBar).toBeVisible();
  });

  test('should add multiple food types to warmer', async ({ page }) => {
    // 1. Trigger order with burger and fries
    const eventData = {
      orderId: 1,
      customerName: 'Test Customer',
      tableNumber: 1,
      items: [
        { foodType: 'burger' as const, quantity: 1 },
        { foodType: 'fries' as const, quantity: 1 },
      ],
    } satisfies OrderCreatedEvent['data'];

    await page.request.post('http://localhost:3000/api/events/order', {
      data: eventData
    });

    // 2. Wait for both preparations to complete (burger takes longer)
    const prepTimeout = FOOD_CONFIG.burger.prepTime + COMPLETION_OVERHEAD;
    await page.waitForTimeout(prepTimeout);

    // 3. Verify both food types in warmer database
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/foodwarmer');
      const json = await res.json();
      const inventory = json.data?.inventory || [];
      // Should have 5 burgers + 8 fries = 13 items
      return inventory.length;
    }, { timeout: 5000 }).toBe(FOOD_CONFIG.burger.batchSize + FOOD_CONFIG.fries.batchSize);

    // 4. Verify both food types visible in UI
    const freshItemsSection = page.getByRole('heading', { name: /Fresh Items/i }).locator('..');
    await expect(freshItemsSection.getByText('🍔').first()).toBeVisible();
    await expect(freshItemsSection.getByText('🍟').first()).toBeVisible();
  });

  test('should remove expired items from warmer', async ({ page }) => {
    // 1. Trigger order for fries (shorter shelf life)
    const eventData = {
      orderId: 100, // Use unique order ID to avoid conflicts
      customerName: 'Test Customer',
      tableNumber: 1,
      items: [
        { foodType: 'fries' as const, quantity: 1 },
      ],
    } satisfies OrderCreatedEvent['data'];

    await page.request.post('http://localhost:3000/api/events/order', {
      data: eventData
    });

    // 2. Wait for preparation to complete and matcher to allocate
    const prepTimeout = FOOD_CONFIG.fries.prepTime + COMPLETION_OVERHEAD + 1000; // Extra time for matcher
    await page.waitForTimeout(prepTimeout);

    // 3. Verify items appear in warmer
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/foodwarmer');
      const json = await res.json();
      return json.data?.inventory?.filter((item: { foodType: string }) => item.foodType === 'fries').length;
    }, { timeout: 5000 }).toBe(FOOD_CONFIG.fries.batchSize);

    // 4. Wait for expiration (shelf life + overhead)
    const expirationTimeout = FOOD_CONFIG.fries.shelfLife + COMPLETION_OVERHEAD;

    // 5. Verify items removed from warmer after expiration
    await expect.poll(async () => {
      const res = await page.request.get('http://localhost:3000/api/foodwarmer');
      const json = await res.json();
      const friesCount = json.data?.inventory?.filter((item: { foodType: string }) => item.foodType === 'fries').length || 0;
      return friesCount;
    }, { timeout: expirationTimeout }).toBe(0);

    // 6. Verify UI shows warmer is empty
    await expect(page.getByText('Food warmer empty')).toBeVisible();
  });
});
