# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development (Next.js + Inngest Dev Server)
npm run dev

# Start only Next.js
npm run dev:next

# Start only Inngest Dev Server
npm run inngest:dev

# Database commands
npm run db:push      # Apply schema changes to SQLite
npm run db:studio    # Open Drizzle Studio for database inspection
npm run db:generate  # Generate migration files

# Code quality
npm run lint         # Run ESLint
npm run lint -- --fix  # Auto-fix linting issues

# Build and start production
npm run build
npm run start

# Initial setup (install deps + create database)
npm run setup
```

## Development Conventions

- Don't try to run 'npm run dev' unless I have instructed you to. Assume that I'm running it all the time in the background.

## TypeScript Best Practices

- Try to use typescript 'satisfies' instead of typecasting with 'as' whenever possible.

## UI/UX Design Principles

- Only add shadows to clickable things or things that overlay - so it's clear what is clickable and if something is elevated.

## High-Level Architecture

### Event-Driven Kitchen System

The FastFood Workshop simulates a restaurant kitchen using event-driven architecture with Inngest. The flow:

1. **Order Creation** → API endpoint creates order in database → Triggers `order.created` event
2. **Order Processing** → Inngest function checks food warmer inventory → Either fulfills from warmer or triggers preparation
3. **Food Preparation** → `food.prepare` event → Simulates cooking time → Adds to warmer with expiration
4. **Warmer Management** → Food items have shelf life → Expired items trigger `food.expired` event
5. **Order Fulfillment** → When all items ready → Update order status → Trigger `order.fulfilled` event

### Key Architectural Components

- **Database (SQLite + Drizzle ORM)**: 
  - Orders and order items tracking
  - Food warmer inventory with expiration timestamps
  - Waste log for expired/cancelled food
  
- **Inngest Event System**:
  - Typed events in `inngest/client.ts` using `EventSchemas`
  - Functions in `inngest/functions/` handle workflow steps
  - Dev server at http://localhost:8288 for debugging
  
- **API Routes (Next.js App Router)**:
  - RESTful endpoints in `app/api/`
  - Consistent `ApiResponse<T>` wrapper type
  - Database operations with proper error handling

- **React Query Integration**:
  - Real-time UI updates in kitchen dashboard
  - Polling for order status changes
  - Optimistic updates for better UX

### Food Configuration

Food types have different characteristics (defined in `lib/constants.ts`):
- **Fries**: 2s prep, batch of 4, 8s shelf life
- **Burgers**: 5s prep, single item, 10s shelf life  
- **Sodas**: Instant (0s), no expiration

## Next.js 15 Route Handler Updates

### Dynamic Route Parameters

In Next.js 15, dynamic route parameters are now async. Update your route handlers:

```typescript
// ❌ OLD - Next.js 14 and below
export const GET = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const id = params.id;
}

// ✅ NEW - Next.js 15
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
}
```

### Type Assertions vs satisfies

When working with typed data, prefer `satisfies` over `as`:

```typescript
// ❌ BAD - Type assertion
const orders = [
  { status: 'pending' as OrderStatus }
];

// ✅ GOOD - satisfies at array level
import type { InferInsertModel } from 'drizzle-orm';

const orders = [
  { status: 'pending' }
] satisfies InferInsertModel<typeof ordersTable>[];
```

### Common Type and Lint Issues to Avoid

1. **React Hook Rules**: Hooks must be called at the top level, not inside callbacks or conditions
2. **Unused imports**: Remove imports that aren't used
3. **Unescaped entities in JSX**: Use `&apos;` for apostrophes
4. **Explicit any types**: Always specify proper types
5. **Namespace as type**: Use index lookup pattern `FastFood['Order']` not direct reference

# FastFood Workshop - TypeScript Conventions

This file contains strict TypeScript conventions for the FastFood Workshop codebase. All code must follow these guidelines.

## Type Declarations

### Use `type` not `interface`

```typescript
// ✅ GOOD
type Order = {
  id: number;
  customerName: string | null;
  items: OrderItem[];
};

// ❌ BAD - Never use interface
interface Order {
  id: number;
  customerName: string | null;
  items: OrderItem[];
}
```

### Global Types in types.d.ts

All backend schema types MUST be declared in the global `types.d.ts` file under the `FastFood` namespace:

```typescript
// types.d.ts
declare namespace FastFood {
  type Order = {
    id: number;
    customerName: string | null;
    // ...
  };
}
```

### Type Index Lookup Pattern

When referencing global types, ALWAYS use index lookup:

```typescript
// ✅ GOOD - Index lookup
type Order = FastFood['Order'];
type OrderStatus = FastFood['OrderStatus'];

// ❌ BAD - Direct reference
type Order = FastFood.Order;
```

**Note**: If you encounter "Cannot use namespace 'FastFood' as a type" errors, create local type aliases:

```typescript
// At the top of your file
type FoodType = FastFood['FoodType'];
type Order = FastFood['Order'];

// Then use the local types
const foodType: FoodType = 'burger';
```

## Import/Export Patterns

### Named Exports Only

```typescript
// ✅ GOOD
export const processOrder = () => {};
export type OrderProcessor = () => void;

// ❌ BAD - No default exports
export default processOrder;
```

### Type-Only Imports

```typescript
// ✅ GOOD - Separate type imports
import type { FC, ReactNode } from 'react';
import { useState, useEffect } from 'react';

// ❌ BAD - Mixed imports
import { FC, useState } from 'react';
```

## Function Declarations

### Arrow Functions for Components

```typescript
// ✅ GOOD
export const Dashboard: FC = () => {
  return <div>Dashboard</div>;
};

// ❌ BAD
export function Dashboard() {
  return <div>Dashboard</div>;
}
```

### Explicit Return Types

```typescript
// ✅ GOOD - Explicit return type
export const calculateTotal = (items: FastFood['OrderItem'][]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ❌ BAD - Implicit return
export const calculateTotal = (items: FastFood['OrderItem'][]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

## Database Schema Types

### Drizzle Table Inference

```typescript
// ✅ GOOD - Infer from table
import { orders } from '@/db/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type OrderSelect = InferSelectModel<typeof orders>;
type OrderInsert = InferInsertModel<typeof orders>;

// ❌ BAD - Manual type definition
type OrderSelect = {
  id: number;
  customerName: string | null;
  // ...
};
```

## API Response Types

### Consistent API Response Structure

```typescript
// ✅ GOOD
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const GET = async (): Promise<Response> => {
  const response: ApiResponse<FastFood['Order'][]> = {
    success: true,
    data: orders,
  };
  return Response.json(response);
};
```

## Inngest Event Types

### Strict Event Typing

```typescript
// ✅ GOOD - Centralized event types
type KitchenEvents = {
  'order.created': {
    data: {
      orderId: FastFood['Order']['id'];
      items: FastFood['OrderItem'][];
    };
  };
};

// Use with Inngest client
export const inngest = new Inngest({
  id: 'fastfood-kitchen',
  schemas: new EventSchemas().fromRecord<KitchenEvents>(),
});
```

## Inngest Best Practices

### Durable Execution Principles

**CRITICAL**: Follow these principles when writing Inngest functions to ensure proper durable execution:

#### 1. Event Sending Must Be Outside step.run

```typescript
// ❌ BAD - Events inside step.run will be replayed
await step.run('process-item', async () => {
  const result = await doSomething();
  await step.sendEvent('Send next event', { name: 'next.event', data: result }); // WRONG!
  return result;
});

// ✅ GOOD - Events outside step.run are only sent once
const result = await step.run('process-item', async () => {
  return await doSomething();
});

await step.sendEvent('Send next event', { name: 'next.event', data: result }); // CORRECT!
```

#### 2. Step.run Returns Data for Next Steps

```typescript
// ✅ GOOD - Calculate what events to send inside step.run, send them outside
const eventsToSend = await step.run('calculate-events', async () => {
  const items = await db.select().from(table);
  return items.map(item => ({
    eventName: 'item.process',
    data: { itemId: item.id }
  }));
});

// Send events outside the step
for (const event of eventsToSend) {
  await step.sendEvent(`Send ${event.eventName} event`, { name: event.eventName, data: event.data });
}
```

#### 3. Each step.run Should Be Idempotent

```typescript
// ✅ GOOD - Check if operation already completed
await step.run('create-record', async () => {
  const existing = await db.select().from(table).where(eq(table.id, id));
  if (existing.length > 0) {
    return existing[0]; // Already exists, return it
  }
  
  const [record] = await db.insert(table).values(data).returning();
  return record;
});
```

#### 4. Avoid Side Effects in step.run

```typescript
// ❌ BAD - External API calls that might fail or change
await step.run('notify', async () => {
  await sendEmail(user.email); // External side effect!
  await updateExternalSystem(); // Another side effect!
});

// ✅ GOOD - Prepare data, handle side effects with events
const notification = await step.run('prepare-notification', async () => {
  return {
    email: user.email,
    template: 'order-confirmation',
    data: orderData
  };
});

// Handle side effects through events
await step.sendEvent('Send email notification', { name: 'email.send', data: notification });
```

#### 5. Use Type-Safe Event Handling

```typescript
// ✅ GOOD - Import event types for type safety
import type { OrderCreatedEvent } from '@/inngest/client';

export const processOrder = inngest.createFunction(
  { id: 'process-order', name: 'Process Order' },
  { event: 'order.created' },
  async ({ event, step }) => {
    // event.data is fully typed from OrderCreatedEvent
    const { orderId, items } = event.data;
  }
);
```

#### 6. Handle step.sendEvent Type Inference Issues

**IMPORTANT**: Inngest v3.x has a known TypeScript limitation where `step.sendEvent` incorrectly infers all events should match the triggering event's data shape.

```typescript
// ❌ BAD - Missing name parameter
await step.sendEvent('warmer.item.add', {
  data: { foodType, quantity, orderId, batchId, expiresAt }
});

// ✅ GOOD - Include name parameter
await step.sendEvent('Add item to warmer', {
  name: 'warmer.item.add',
  data: { foodType, quantity, orderId, batchId, expiresAt }
});
```

This workaround:
- Maintains type safety (doesn't use `any`)
- Works around the Inngest type inference limitation
- Should include a comment explaining why it's needed
- Is safe because the runtime behavior is correct

## React Component Props

### Explicit Props Types

```typescript
// ✅ GOOD
type OrderCardProps = {
  order: FastFood['Order'];
  onStatusChange: (status: FastFood['OrderStatus']) => void;
};

export const OrderCard: FC<OrderCardProps> = ({ order, onStatusChange }) => {
  // ...
};

// ❌ BAD - Inline props
export const OrderCard: FC<{ order: any; onStatusChange: any }> = (props) => {
  // ...
};
```

## Async/Await Patterns

### Always Use Async/Await

```typescript
// ✅ GOOD
export const fetchOrders = async (): Promise<FastFood['Order'][]> => {
  const response = await fetch('/api/orders');
  const data = await response.json();
  return data;
};

// ❌ BAD - Promise chains
export const fetchOrders = () => {
  return fetch('/api/orders')
    .then(res => res.json())
    .then(data => data);
};
```

## Error Handling

### Explicit Error Types

```typescript
// ✅ GOOD
type KitchenError = {
  code: 'OUT_OF_STOCK' | 'INVALID_ORDER' | 'KITCHEN_CLOSED';
  message: string;
};

export const processOrder = async (
  order: FastFood['Order']
): Promise<{ success: true } | { success: false; error: KitchenError }> => {
  // ...
};
```

## Constants and Enums

### Use const assertions

```typescript
// ✅ GOOD
export const FOOD_CONFIG = {
  fries: {
    prepTime: 2000,
    batchSize: 4,
    shelfLife: 8000,
  },
  burger: {
    prepTime: 5000,
    batchSize: 1,
    shelfLife: 10000,
  },
  soda: {
    prepTime: 0,
    batchSize: 1,
    shelfLife: Infinity,
  },
} as const;

type FoodType = keyof typeof FOOD_CONFIG;
```

## File Naming Conventions

- Components: `OrderCard.tsx` (PascalCase)
- Utilities: `calculate-total.ts` (kebab-case)
- Types: `types.d.ts` (lowercase)
- Constants: `constants.ts` (lowercase)

## Do NOT Use

- `any` type (use `unknown` if type is truly unknown)
- `@ts-ignore` (fix the type issue instead)
- Non-null assertion `!` (use proper null checks)
- `as` type assertions (use type guards instead)

## Project Structure

### CRITICAL: No src/ Directory

This Next.js project uses the App Router WITHOUT a src directory. All code lives in the root:
- `app/` - Next.js App Router pages and API routes
- `db/` - Database schema and connection
- `lib/` - Utilities and services
- `inngest/` - Inngest client and functions
- `components/` - React components

**NEVER create or use a `src/` directory in this project!**

## Example Compliant File

```typescript
// components/OrderCard.tsx
import type { FC } from 'react';
import { useState } from 'react';

type OrderCardProps = {
  order: FastFood['Order'];
  onStatusUpdate: (orderId: number, status: FastFood['OrderStatus']) => Promise<void>;
};

export const OrderCard: FC<OrderCardProps> = ({ order, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: FastFood['OrderStatus']): Promise<void> => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="order-card">
      {/* Component implementation */}
    </div>
  );
};
```