# End-to-End Tests for Inngest Workshop

This directory contains Playwright tests for the three workshop exercises.

## Prerequisites

- Node.js 18+ installed
- Workshop dependencies installed (`npm install`)
- Playwright browsers installed (`npx playwright install chromium`)

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests with UI (recommended for development)

```bash
npm run test:ui
```

### Run tests in debug mode

```bash
npm run test:debug
```

### Run individual exercise tests

```bash
# Exercise 1: Food Preparation
npm run test:exercise1

# Exercise 2: Warmer Management
npm run test:exercise2

# Exercise 3: Order Fulfillment
npm run test:exercise3
```

## Test Structure

Each test file follows this pattern:

1. **Reset database** - Calls `POST /api/dev/reset` to clear all data
2. **Navigate to kitchen** - Opens `http://localhost:3000/kitchen`
3. **Run test scenarios** - Tests specific functionality

### Exercise 1: exercise1-prepare-food.spec.ts

Tests for the food preparation workflow:

- Food preparation starts and completes

### Exercise 2: exercise2-warmer-management.spec.ts

Tests for warmer inventory management:

- Items are added to warmer after preparation
- Multiple food types are added to warmer
- Expired items are removed from warmer

### Exercise 3: exercise3-fulfill-order.spec.ts

Tests for order fulfillment:

- Smoke test: can find ready order in UI
- Simple single-item orders are completed and marked as ready
- Multi-item orders are completed and marked as ready

## Writing Tests

When implementing tests, you can use:

- **page.request** - Make API calls directly
- **page.goto()** - Navigate to pages
- **page.locator()** - Find elements on the page
- **expect()** - Make assertions

Example:

```typescript
test('example test', async ({ page }) => {
  // Reset database
  await page.request.post('http://localhost:3000/api/dev/reset', {
    data: { seed: false },
  });

  // Navigate
  await page.goto('http://localhost:3000/kitchen');

  // Interact with the page
  await page.locator('button:has-text("Order Burger")').click();

  // Make assertions
  await expect(page.locator('.order-card')).toBeVisible();
});
```

## Debugging Tests

1. Use `npm run test:ui` to run tests interactively
2. Use `npm run test:debug` to step through tests
3. Add `await page.pause()` in your test to pause execution
4. Screenshots are automatically taken on failure

## Test Configuration

See `playwright.config.ts` in the root directory for configuration details.

Key settings:

- Tests run with workers=1 (sequential, not parallel)
- Web server automatically starts on `http://localhost:3000`
- Screenshots on failure
- HTML report generated after test run
