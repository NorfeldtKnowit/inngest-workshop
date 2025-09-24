'use client';

import type { FC } from 'react';
import { Card } from '@/components/ui/card';
import { FOOD_EMOJIS, FOOD_CONFIG } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { FoodWarmerTimer } from '@/components/food-warmer-timer';
import { useFoodWarmerCountdown } from '@/lib/hooks/use-food-warmer-countdown';
import { cn } from '@/lib/utils';

type FoodWarmerStackProps = {
  items: FastFood['FoodWarmerItem'][];
  foodType: FastFood['FoodType'];
  isExpired?: boolean;
};

export const FoodWarmerStack: FC<FoodWarmerStackProps> = ({ items, foodType, isExpired = false }) => {
  // Limit to max 3 cards for visual clarity
  const visibleItems = items.slice(0, 3);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const shelfLife = FOOD_CONFIG[foodType].shelfLife;
  
  // For the center card, get countdown data
  const centerIndex = Math.floor((visibleItems.length - 1) / 2);
  const centerItem = visibleItems[centerIndex];
  // Always call the hook, but use a dummy date if no center item
  const centerCountdown = useFoodWarmerCountdown(
    centerItem?.expiresAt || new Date(), 
    shelfLife
  );

  // Don't render if no items
  if (items.length === 0) return null;

  const getCardStyle = (index: number) => {
    const totalCards = visibleItems.length;
    const centerIndex = (totalCards - 1) / 2;

    // Calculate rotation angle for fan effect (following CardStack model)
    const rotationAngle = (index - centerIndex) * 8;
    
    // Calculate horizontal offset for fan spread  
    const horizontalOffset = (index - centerIndex) * 15;
    
    // Calculate vertical offset (cards further from center are slightly lower)
    const verticalOffset = Math.abs(index - centerIndex) * 8;
    
    // Scale effect - center card is largest
    const scale = 1 - Math.abs(index - centerIndex) * 0.02;

    return {
      transform: `translate(${horizontalOffset}px, ${verticalOffset}px) rotate(${rotationAngle}deg) scale(${scale})`,
      zIndex: totalCards - Math.abs(index - centerIndex),
      transformOrigin: 'center center',
    };
  };

  const getCardColor = (index: number) => {
    const isCenterCard = index === Math.floor((visibleItems.length - 1) / 2);
    
    // All cards use solid colors - no transparency
    if (isCenterCard) {
      if (isExpired) return "bg-red-100 border-destructive";
      return "bg-card border-border";
    } else {
      if (isExpired) return "bg-red-200 border-red-400";
      return "bg-muted border-muted-foreground";
    }
  };

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {visibleItems.map((item, index) => {
        const isCenterCard = index === centerIndex;
        const { percentage, isExpiring } = isCenterCard ? centerCountdown : { percentage: 100, isExpiring: false };

        return (
          <Card
            key={item.id}
            className={cn(
              "absolute w-64 h-32 select-none",
              "shadow-lg transition-all duration-300",
              "border rounded-xl overflow-hidden",
              getCardColor(index)
            )}
            style={getCardStyle(index)}
          >
            <div className="p-4 h-full flex flex-col justify-between">
              {/* Header with food icon and quantity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {FOOD_EMOJIS[foodType]}
                  </span>
                  <div>
                    <div className="font-bold text-lg">
                      ×{isCenterCard ? totalQuantity : item.quantity}
                    </div>
                    {isCenterCard && items.length > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {items.length} batches
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Timer - only show on center card */}
                {isCenterCard && (
                  <FoodWarmerTimer 
                    expiresAt={item.expiresAt}
                    foodType={foodType}
                    shelfLife={shelfLife}
                  />
                )}
              </div>

              {/* Progress bar - only show on center card */}
              {isCenterCard && (
                <div className="space-y-2">
                  <Progress 
                    value={percentage} 
                    className={cn(
                      "h-2",
                      (isExpiring || isExpired) && "[&>div]:bg-destructive"
                    )}
                  />
                  
                  {isExpired && (
                    <p className="text-xs text-destructive font-medium">
                      ⚠️ Should be removed - food safety risk!
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};