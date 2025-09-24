'use client';

import type { FC } from 'react';
import { FOOD_EMOJIS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { FoodWarmerTimer } from '@/components/food-warmer-timer';
import { useFoodWarmerCountdown } from '@/lib/hooks/use-food-warmer-countdown';
import { cn } from '@/lib/utils';

type FoodWarmerItemProps = {
  item: FastFood['FoodWarmerItem'];
};

export const FoodWarmerItem: FC<FoodWarmerItemProps> = ({ item }) => {
  const shelfLife = item.foodType === 'fries' ? 8000 : 
                   item.foodType === 'burger' ? 10000 : Infinity;
  
  const { percentage, isExpired, isExpiring } = useFoodWarmerCountdown(item.expiresAt, shelfLife);

  return (
    <div 
      className={cn(
        "p-4 border-2 transition-all",
        isExpired ? "bg-orange-200 border-orange-800 shadow-[3px_3px_0px_rgba(154,52,18,0.8)] animate-wiggle" :
        isExpiring ? "bg-orange-100 border-orange-800 shadow-[3px_3px_0px_rgba(154,52,18,0.8)]" : 
        "bg-white border-orange-800 shadow-[3px_3px_0px_rgba(154,52,18,0.8)]"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {FOOD_EMOJIS[item.foodType as keyof typeof FOOD_EMOJIS]}
          </span>
          <span className="font-bold text-lg">×{item.quantity}</span>
        </div>
        <FoodWarmerTimer 
          expiresAt={item.expiresAt}
          foodType={item.foodType}
          shelfLife={shelfLife}
        />
      </div>
      <Progress 
        value={percentage} 
        className={cn(
          "h-2",
          isExpired && "[&>div]:bg-orange-600 border-orange-800",
          isExpiring && "[&>div]:bg-orange-500 border-orange-800",
          !isExpired && !isExpiring && "[&>div]:bg-orange-400"
        )}
      />
      {isExpired && (
        <p className="text-xs text-orange-900 font-bold uppercase mt-1">
          ⚠️ Should be removed - food safety risk!
        </p>
      )}
    </div>
  );
};