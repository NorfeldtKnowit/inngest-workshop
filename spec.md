# FastFood Workshop - Inngest Learning Application Specification

## Overview

A hands-on workshop application designed to teach event-driven architecture using Inngest through a simulated fast-food kitchen order system. Participants will implement business logic to handle orders, manage food preparation, track inventory in "food warmers", and minimize waste.

## Workshop Duration

- **Total**: 2 hours
- **Introduction**: 30 minutes
- **Hands-on coding**: 1.5 hours

## Tech Stack

### Core Technologies

- **Framework**: Next.js 14+ (App Router)
  - Full-stack TypeScript support
  - API routes for CRUD operations
  - Hot module reloading
  - Cross-platform compatibility (Mac/Windows)

- **Database**: SQLite with Drizzle ORM
  - Embedded database (no separate process)
  - TypeScript-first schema definition
  - Zero configuration for workshop participants
  - Database migrations via Drizzle Kit

- **Event Processing**: Inngest
  - Local development server
  - Event-driven architecture
  - Visual debugging via Dev Server UI
  - Step functions for complex workflows

- **State Management**: TanStack Query
  - Server state synchronization
  - Optimistic updates
  - Real-time UI updates

- **Styling**: Tailwind CSS
  - Rapid prototyping
  - Consistent design system
  - Responsive by default

### Development Tools

- **TypeScript**: Strict mode with custom conventions
- **Package Manager**: npm (for consistency)
- **Testing**: Inngest Dev Server for manual testing
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier

## Application Features

### 1. Order Management

- Create new orders with multiple items
- Track order status (pending → preparing → ready → delivered)
- Support for different food types:
  - **Fries**: 2 sec prep time, makes 4 portions, 8 sec shelf life
  - **Burgers**: 5 sec prep time, makes 1 portion, 10 sec shelf life
  - **Sodas**: Instant (0 sec prep time), no shelf life

### 2. Food Warmer System

- Acts as a cache for prepared food
- Visual representation with emojis (🍟 🍔 🥤)
- Automatic expiration and waste tracking
- Real-time countdown timers
- Batch preparation logic

### 3. Kitchen Display

- Real-time order queue
- Preparation timers
- Food warmer inventory levels
- Waste metrics dashboard
- Order completion tracking

### 4. Business Logic (via Inngest)

Workshop participants will implement:
- Order processing workflow
- Food preparation scheduling
- Inventory management
- Waste prevention strategies
- Rush hour handling

## Data Schema

```typescript
// types.d.ts - Global type definitions
declare namespace FastFood {
  type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  type FoodType = 'fries' | 'burger' | 'soda';
  
  type Order = {
    id: number;
    customerName: string;
    tableNumber: number;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  
  type OrderItem = {
    id: number;
    orderId: number;
    foodType: FoodType;
    quantity: number;
    price: number;
  };
  
  type FoodWarmerItem = {
    id: number;
    foodType: FoodType;
    quantity: number;
    expiresAt: Date;
    createdAt: Date;
  };
  
  type WasteLog = {
    id: number;
    foodType: FoodType;
    quantity: number;
    reason: 'expired' | 'cancelled' | 'mistake';
    wastedAt: Date;
  };
}
```

## API Endpoints

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

### Food Warmer
- `GET /api/foodwarmer` - Get current inventory
- `POST /api/foodwarmer` - Add items (triggered by Inngest)
- `DELETE /api/foodwarmer/:id` - Remove expired items

### Waste Tracking
- `GET /api/waste` - Get waste statistics
- `POST /api/waste` - Log wasted items

### Kitchen Events
- `POST /api/inngest` - Inngest webhook endpoint

## Inngest Event Flow

### Events

```typescript
type KitchenEvents = {
  'order.created': {
    data: {
      orderId: number;
      items: Array<{
        foodType: FastFood.FoodType;
        quantity: number;
      }>;
    };
  };
  
  'food.prepare': {
    data: {
      foodType: FastFood.FoodType;
      quantity: number;
      orderId: number;
    };
  };
  
  'food.ready': {
    data: {
      foodType: FastFood.FoodType;
      quantity: number;
      warmerId?: number;
    };
  };
  
  'food.expired': {
    data: {
      warmerId: number;
      foodType: FastFood.FoodType;
      quantity: number;
    };
  };
  
  'order.fulfilled': {
    data: {
      orderId: number;
      items: Array<{
        foodType: FastFood.FoodType;
        quantity: number;
        fromWarmer: boolean;
      }>;
    };
  };
};
```

### Core Functions (To be implemented by participants)

1. **processOrder** - Main order processing workflow
2. **prepareFood** - Handle food preparation with delays
3. **manageWarmer** - Check warmer before preparing new food
4. **expireFood** - Remove expired items and log waste
5. **fulfillOrder** - Complete order and update status

## UI Components

### Kitchen Dashboard
- Order queue (left panel)
- Active preparations (center)
- Food warmer display (right panel)
- Waste metrics (bottom)

### Visual Elements
- Real-time countdown timers
- Emoji representations:
  - 🍟 Fries
  - 🍔 Burgers  
  - 🥤 Sodas
  - 🗑️ Waste bin
- Color coding for order status
- Progress bars for preparation

## Workshop Progression

### Exercise 1: Basic Order Flow (20 min)
- Create order via API
- Trigger Inngest event
- Update order status

### Exercise 2: Food Preparation (20 min)
- Implement preparation delays
- Add items to food warmer
- Handle single item orders

### Exercise 3: Warmer Management (20 min)
- Check warmer before preparing
- Implement FIFO consumption
- Track waste for expired items

### Exercise 4: Batch Optimization (20 min)
- Prepare fries in batches of 4
- Handle concurrent orders
- Minimize waste

### Exercise 5: Rush Hour Simulation (20 min)
- Handle multiple simultaneous orders
- Optimize preparation scheduling
- Balance freshness vs. waste

## Success Criteria

Participants successfully complete the workshop when:
1. Orders flow from creation to delivery
2. Food warmer prevents unnecessary preparation
3. Expired food is tracked as waste
4. UI updates in real-time
5. At least 3 test cases pass

## Setup Instructions

```bash
# Clone repository
git clone https://github.com/[org]/fastfood-workshop.git
cd fastfood-workshop

# Install dependencies
npm install

# Initialize database
npm run db:push

# Start development servers (in separate terminals)
npm run dev          # Next.js app
npm run inngest:dev  # Inngest Dev Server

# Access application
# App: http://localhost:3000
# Inngest: http://localhost:8288
```

## Directory Structure

```
fastfood-workshop/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── orders/
│   │   │   ├── foodwarmer/
│   │   │   ├── waste/
│   │   │   └── inngest/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions/
│   │       └── .gitkeep (participants implement here)
│   └── lib/
│       ├── services/
│       └── utils/
├── types.d.ts
├── CLAUDE.md
├── drizzle.config.ts
├── next.config.js
├── package.json
└── README.md
```

## Testing Strategy

### Manual Testing via Inngest Dev Server
1. Send test events through UI
2. Monitor function execution
3. Verify database changes
4. Check UI updates

### Test Scenarios (Provided)
1. Single fries order
2. Multiple burger orders
3. Mixed order with all items
4. Rush hour simulation
5. Waste tracking verification

## Deployment Considerations

While this is a workshop app for local development:
- Inngest functions are deployment-ready
- Database uses SQLite file (portable)
- Environment variables for production
- Vercel deployment compatible

## Additional Resources

- Inngest documentation: https://www.inngest.com/docs
- Workshop slides (provided separately)
- Solution branch for instructors
- Video walkthrough (optional)