# FastFood Workshop - TypeScript Conventions

This file contains strict TypeScript conventions for the FastFood Workshop codebase. All code must follow these guidelines.

## Type Declarations

### Use `type` not `interface`

```typescript
// ✅ GOOD
type Order = {
  id: number;
  customerName: string;
  items: OrderItem[];
};

// ❌ BAD - Never use interface
interface Order {
  id: number;
  customerName: string;
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
    customerName: string;
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
  customerName: string;
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

## Example Compliant File

```typescript
// src/components/OrderCard.tsx
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