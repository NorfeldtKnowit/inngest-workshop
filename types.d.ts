declare namespace FastFood {
  type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  type FoodType = 'fries' | 'burger' | 'soda';
  type WasteReason = 'expired' | 'cancelled' | 'mistake';
  
  type Order = {
    id: number;
    customerName: string | null;
    tableNumber: number;
    items: OrderItem[];
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
  };
  
  type OrderItem = {
    id: number;
    orderId: number;
    foodType: FoodType;
    quantity: number;
    placedOnTray: number;
  };
  
  type FoodWarmerItem = {
    id: number;
    foodType: FoodType;
    expiresAt: Date;
    createdAt: Date;
  };
  
  type WasteLog = {
    id: number;
    foodType: FoodType;
    quantity: number;
    reason: WasteReason;
    wastedAt: Date;
  };
  
  // API Response types
  type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
  };
  
  // Kitchen configuration
  type FoodConfig = {
    prepTime: number;
    batchSize: number;
    shelfLife: number;
  };

  // Active preparation tracking
  type ActivePreparation = {
    id: number;
    foodType: FoodType;
    quantity: number;
    startedAt: Date;
    completesAt: Date;
    status: 'preparing' | 'ready';
  };
}