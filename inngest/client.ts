import { Inngest, EventSchemas } from 'inngest';

// Define typed events for kitchen operations
type KitchenEvents = {
  'order.created': {
    data: {
      orderId: FastFood['Order']['id'];
      customerName: FastFood['Order']['customerName'] | null;
      tableNumber: FastFood['Order']['tableNumber'];
      items: Array<{
        foodType: FastFood['FoodType'];
        quantity: number;
      }>;
    };
  };
  'food.prepare': {
    data: {
      foodType: FastFood['FoodType'];
      quantity: number;
      orderId: FastFood['Order']['id'];
      batchId: string;
    };
  };
  'food.ready': {
    data: {
      foodType: FastFood['FoodType'];
      quantity: number;
      batchId: string;
      warmerId: FastFood['FoodWarmerItem']['id'];
      expiresAt: string; // ISO string
    };
  };
  'food.expired': {
    data: {
      warmerId: FastFood['FoodWarmerItem']['id'];
      foodType: FastFood['FoodType'];
      quantity: number;
      reason: FastFood['WasteReason'];
    };
  };
  'order.fulfilled': {
    data: {
      orderId: FastFood['Order']['id'];
      customerName: FastFood['Order']['customerName'] | null;
      tableNumber: FastFood['Order']['tableNumber'];
      fulfilledAt: string; // ISO string
    };
  };
  'order.item.placed': {
    data: {
      orderId: FastFood['Order']['id'];
      foodType: FastFood['FoodType'];
      quantity: number;
      warmerId?: FastFood['FoodWarmerItem']['id']; // Optional - present when from warmer
    };
  };
  'warmer.item.add': {
    data: {
      foodType: FastFood['FoodType'];
      orderId: FastFood['Order']['id'];
      batchId: string;
      expiresAt: string; // ISO string
    };
  };
  'warmer.item.remove': {
    data: {
      warmerId: FastFood['FoodWarmerItem']['id'];
      orderId: FastFood['Order']['id'];
      foodType: FastFood['FoodType'];
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