import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerName: text('customer_name').default('Guest'),
  tableNumber: integer('table_number').notNull(),
  status: text('status', { 
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] 
  }).default('pending').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Order items table
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  foodType: text('food_type', { 
    enum: ['fries', 'burger', 'soda'] 
  }).notNull(),
  quantity: integer('quantity').notNull(),
  placedOnTray: integer('placed_on_tray').notNull().default(0),
});

// Food warmer table - each row represents ONE food item
export const foodWarmer = sqliteTable('food_warmer', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  foodType: text('food_type', { 
    enum: ['fries', 'burger', 'soda'] 
  }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Waste log table
export const wasteLog = sqliteTable('waste_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  foodType: text('food_type', { 
    enum: ['fries', 'burger', 'soda'] 
  }).notNull(),
  quantity: integer('quantity').notNull(),
  reason: text('reason', { 
    enum: ['expired', 'cancelled', 'mistake'] 
  }).notNull(),
  wastedAt: integer('wasted_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Active preparations table
export const activePreparations = sqliteTable('active_preparations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  foodType: text('food_type', { 
    enum: ['fries', 'burger', 'soda'] 
  }).notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status', { 
    enum: ['preparing', 'ready'] 
  }).default('preparing').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  completesAt: integer('completes_at', { mode: 'timestamp' }).notNull(),
});