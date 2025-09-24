'use client';

import type { FC } from 'react';
import { FoodWarmerItem } from '@/components/food-warmer-item';

type FoodWarmerProps = {
  items: FastFood['FoodWarmerItem'][];
};

export const FoodWarmer: FC<FoodWarmerProps> = ({ items }) => {
  // Separate expired and fresh items
  const freshItems = items.filter(item => new Date(item.expiresAt) > new Date());
  const expiredItems = items.filter(item => new Date(item.expiresAt) <= new Date());

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-orange-700">
        <span className="text-6xl mb-4 block">❄️</span>
        <p className="text-lg font-bold uppercase">Food warmer empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fresh items section */}
      {freshItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-orange-900 uppercase mb-2 flex items-center gap-2 bg-orange-100 px-3 py-1 border border-orange-800 inline-block w-fit">
            <span className="text-lg">✨</span>
            Fresh Items
          </h3>
          <div className="space-y-3">
            {freshItems.map((item) => (
              <FoodWarmerItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Expired items section */}
      {expiredItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-orange-900 uppercase mb-2 flex items-center gap-2 bg-orange-200 px-3 py-1 border border-orange-800 inline-block w-fit">
            <span className="text-lg">⚠️</span>
            Expired Items
          </h3>
          <div className="space-y-3">
            {expiredItems.map((item) => (
              <FoodWarmerItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {freshItems.length === 0 && expiredItems.length === 0 && (
        <div className="text-center py-8 text-orange-700">
          <p className="text-sm font-bold uppercase">No items in warmer</p>
        </div>
      )}
    </div>
  );
};