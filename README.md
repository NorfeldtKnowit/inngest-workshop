![inngest](inngest.JPG)

# Learn Inngest with Event-Driven Architecture

Welcome to the FastFood Workshop! This hands-on workshop teaches event-driven architecture using Inngest through a simulated fast-food kitchen order system.

## 🎯 Workshop Goals

- Understand event-driven architecture concepts
- Learn to build workflows with Inngest
- Implement real-world patterns like queuing, batching, and caching
- Minimize waste through smart inventory management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git
- Code editor (VS Code recommended)

### Setup (5 minutes)

1. Clone the repository:

   ```bash
   git clone https://github.com/[org]/fastfood-workshop.git
   cd fastfood-workshop
   ```

2. Install dependencies and set up the database:

   ```bash
   npm run setup
   ```

3. Start the development servers:

   ```bash
   npm run dev
   ```

   This starts:
   - Next.js app at <http://localhost:3000>
   - Inngest Dev Server at <http://localhost:8288>
   - Drizzle Studio at <https://local.drizzle.studio>

   **Note:** The Inngest Dev Server UI is accessible at <http://localhost:8288> where you can:
   - View and test your event functions
   - Monitor event flows in real-time
   - Manually trigger events for testing

4. Open the kitchen dashboard:
   - Navigate to <http://localhost:3000/kitchen>
   - You should see the kitchen management interface
   - The dashboard includes 3 event trigger buttons for testing orders:
     - **Order Burger** 🍔 - Single burger order
     - **Burger + Fries** 🍔🍟 - Combo order
     - **Full Meal** 🍔🍟🥤 - Complete meal with drink

## 📚 Workshop Structure

1. **Introduction**
   - Inngest concepts
   - Kitchen manual simulation walkthrough

2. **Hands-on Exercises (90 min)**
   You'll implement three core Inngest functions (exercise instructions are written as code comments in the files listed):
   - Exercise 1: **prepare-food.ts** - Implement food preparation with realistic cooking times
   - Exercise 2: **warmer-management.ts** - Handle adding/removing items from the food warmer
   - Exercise 3: **fulfill-order.ts** - Complete orders when all items are ready

   **Note**: Inngest functions use direct database access via `import { db } from '@/db'` - no API calls needed! This is a best practice for internal event-driven systems.

## 🏗️ Project Structure

```text
inngest-workshop/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── orders/        # Order management
│   │   ├── foodwarmer/    # Inventory tracking
│   │   ├── preparations/  # Food preparation tracking
│   │   ├── waste/         # Waste metrics
│   │   ├── events/        # Event triggers
│   │   ├── dev/           # Development utilities
│   │   └── inngest/       # Inngest webhook
│   └── kitchen/           # Dashboard UI
├── db/                    # Database schema
├── inngest/               # Event functions
│   ├── client.ts         # Inngest client setup
│   └── functions/        # Your workshop code goes here!
│       ├── index.ts                # Function exports
│       ├── process-order.ts        # Order processing (provided)
│       ├── prepare-food.ts         # Exercise 1: Food preparation
│       ├── warmer-management.ts    # Exercise 2: Warmer inventory
│       └── fulfill-order.ts        # Exercise 3: Order fulfillment
├── lib/                   # Utilities
└── components/            # UI components
```

## 🍔 The Kitchen System

### Food Types

- **🍟 Fries**: 2 sec prep, makes a batch of 8 fries, 8 sec shelf life
- **🍔 Burgers**: 5 sec prep, makes a batch of 5 burgers, 10 sec shelf life
- **🥤 Sodas**: Instant (0 sec prep), gets added to the order immediately

### Core Concepts

1. **Order Processing**: When an order comes in, the system checks the food warmer for available items. If items are available, they're allocated to the order. Missing items trigger food preparation.
2. **Food Preparation**: Tracks active preparations going on in the kitchen. Each food type has specific prep times and batch sizes.
3. **Food Warmer**: Acts as a cache for prepared food with real-time expiration tracking. Items are allocated on a first-in-first-out (FIFO) basis.
4. **Expiration & Waste**: Food items have a shelf life and automatically expire. The system tracks waste from expired items.

## 🛠️ Available Scripts

```bash
npm run dev          # Start all dev servers (Next.js on :3000, Inngest on :8288, Drizzle Studio on https://local.drizzle.studio)
npm run dev:next     # Start only Next.js development server (http://localhost:3000)
npm run inngest:dev  # Start only Inngest Dev Server (http://localhost:8288)
npm run db:studio    # Open Drizzle Studio (https://local.drizzle.studio/)
npm run db:push      # Apply database schema changes
npm run lint         # Run linter
npm run build        # Build for production
```

### Database Management

To inspect and modify your database:

```bash
npm run db:studio
```

This opens Drizzle Studio at <https://local.drizzle.studio> where you can:

- View all tables and data
- Insert test orders manually
- Clear tables between workshop exercises
- Monitor real-time database changes

## 🏛️ API Architecture

In this workshop, you'll work with two different data access patterns:

1. **Frontend → API → Database**: The kitchen dashboard uses REST APIs to fetch and display data
2. **Inngest → Database**: Event functions access the database directly for maximum performance

This architecture demonstrates a common pattern in modern applications where:

- External clients (frontend, mobile apps) use APIs for data access
- Internal services (background jobs, event handlers) use direct database connections
- APIs provide a controlled interface with validation, rate limiting, and authentication
- Direct database access eliminates network overhead for internal operations

The APIs below are primarily used by the frontend dashboard and for development/testing purposes.

## 📖 API Reference (Frontend & Testing)

### Orders

- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/items/:itemId/place` - Mark order item as placed

### Food Warmer

- `GET /api/foodwarmer` - Get current inventory
- `POST /api/foodwarmer` - Add prepared items
- `DELETE /api/foodwarmer` - Bulk delete expired items
- `DELETE /api/foodwarmer/:id` - Remove specific item
- `POST /api/foodwarmer/:id` - (Internal) Use warmer item for order

### Food Preparations

- `GET /api/preparations` - List active preparations
- `POST /api/preparations` - Start new preparation
- `DELETE /api/preparations/:id` - Cancel preparation

### Waste Tracking

- `GET /api/waste` - Get waste statistics
- `POST /api/waste` - Log wasted items

### Events

- `POST /api/events/order` - Manually trigger order event

### Development

- `POST /api/dev/reset` - Reset database to initial state
- `GET /api/dev/reset` - Get reset statistics

### Check Function Execution

1. Open Inngest Dev Server: <http://localhost:8288>
2. Click on "Events" to see incoming events
3. Click on "Functions" to see your function runs
4. Use "Test" to manually trigger events

### Development URLs

When running `npm run dev`, the following services are available:

| Service | URL | Purpose |
|---------|-----|----------|
| Next.js App | <http://localhost:3000> | Main application and API |
| Kitchen Dashboard | <http://localhost:3000/kitchen> | Order management UI |
| Inngest Dev Server | <http://localhost:8288> | Event debugging and function testing |
| Drizzle Studio | <https://local.drizzle.studio> | Database management UI |
