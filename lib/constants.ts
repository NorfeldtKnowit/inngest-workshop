export const FOOD_CONFIG = {
  fries: {
    prepTime: 2000,
    batchSize: 8,
    shelfLife: 8000,
  },
  burger: {
    prepTime: 5000,
    batchSize: 5,
    shelfLife: 10000,
  },
  soda: {
    prepTime: 0,
    batchSize: 1,
    shelfLife: Infinity,
  },
} as const;

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',  
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

export const FOOD_EMOJIS = {
  fries: '🍟',
  burger: '🍔',
  soda: '🥤',
} as const;

export const WASTE_EMOJI = '🗑️';