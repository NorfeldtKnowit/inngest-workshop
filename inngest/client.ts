import { Inngest, EventSchemas } from 'inngest';

// Direct type definitions to avoid namespace issues
type FoodType = 'fries' | 'burger' | 'soda';
type OrderId = number;
type CustomerName = string | null;
type TableNumber = number;
type WarmerId = number;
type WasteReason = 'expired' | 'cancelled' | 'mistake';

// Define typed events for kitchen operations
type KitchenEvents = {
  'order.created': {
    data: {
      orderId: OrderId;
      customerName: CustomerName | null;
      tableNumber: TableNumber;
      items: Array<{
        foodType: FoodType;
        quantity: number;
      }>;
    };
  };
  'food.prepare': {
    data: {
      foodType: FoodType;
      quantity: number;
      orderId: OrderId;
      batchId: string;
    };
  };
  'food.ready': {
    data: {
      foodType: FoodType;
      quantity: number;
      batchId: string;
      warmerId: WarmerId;
      expiresAt: string; // ISO string
    };
  };
  'food.expired': {
    data: {
      warmerId: WarmerId;
      foodType: FoodType;
      quantity: number;
      reason: WasteReason;
    };
  };
  'order.fulfilled': {
    data: {
      orderId: OrderId;
      customerName: CustomerName | null;
      tableNumber: TableNumber;
      fulfilledAt: string; // ISO string
    };
  };
  'order.item.placed': {
    data: {
      orderId: OrderId;
      foodType: FoodType;
      quantity: number;
      warmerId?: WarmerId; // Optional - present when from warmer
    };
  };
  'warmer.item.add': {
    data: {
      foodType: FoodType;
      orderId: OrderId;
      batchId: string;
      expiresAt: string; // ISO string
    };
  };
  'warmer.item.remove': {
    data: {
      warmerId: WarmerId;
      orderId: OrderId;
      foodType: FoodType;
      quantity: number;
    };
  };
};

// Create the Inngest client with typed event schemas
export const inngest = new Inngest({
  id: 'fastfood-kitchen',
  schemas: new EventSchemas().fromRecord<KitchenEvents>(),
});

// Export event types for use in functions
export type OrderCreatedEvent = KitchenEvents['order.created'];
export type FoodPrepareEvent = KitchenEvents['food.prepare'];
export type FoodReadyEvent = KitchenEvents['food.ready'];
export type FoodExpiredEvent = KitchenEvents['food.expired'];
export type OrderFulfilledEvent = KitchenEvents['order.fulfilled'];
export type OrderItemPlacedEvent = KitchenEvents['order.item.placed'];
export type WarmerItemAddEvent = KitchenEvents['warmer.item.add'];
export type WarmerItemRemoveEvent = KitchenEvents['warmer.item.remove'];