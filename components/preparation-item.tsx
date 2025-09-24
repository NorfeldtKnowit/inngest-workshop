'use client';

import type { FC } from 'react';
import { FOOD_EMOJIS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePreparationCountdown } from '@/lib/hooks/use-preparation-countdown';
import { cn } from '@/lib/utils';

type PreparationItemProps = {
  preparation: FastFood['ActivePreparation'];
};

export const PreparationItem: FC<PreparationItemProps> = ({ preparation }) => {
  const { remainingSeconds, percentage, isReady } = usePreparationCountdown(
    preparation.startedAt,
    preparation.completesAt,
    preparation.status
  );

  return (
    <div 
      className={cn(
        "p-4 border-2 transition-all",
        isReady ? 
          "bg-green-100 border-green-800 shadow-[3px_3px_0px_rgba(22,101,52,0.8)] animate-wiggle" : 
          "bg-white border-yellow-800 shadow-[3px_3px_0px_rgba(113,63,18,0.8)]"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {FOOD_EMOJIS[preparation.foodType as keyof typeof FOOD_EMOJIS]}
          </span>
          <div>
            <p className="font-bold capitalize text-lg">
              {preparation.foodType} Batch
            </p>
            <p className="text-xs font-bold uppercase">
              Batch #{preparation.id}
            </p>
          </div>
        </div>
        <Badge 
          variant={isReady ? "secondary" : "default"} 
          className="text-xs"
        >
          {isReady ? "READY" : `×${preparation.quantity}`}
        </Badge>
      </div>
      <Progress 
        value={percentage} 
        className={cn(
          "h-3",
          isReady ? 
            "[&>div]:bg-green-500 border-green-800 shadow-[2px_2px_0px_rgba(22,101,52,0.8)]" : 
            "[&>div]:bg-yellow-500 border-yellow-800"
        )}
      />
      {preparation.foodType === 'burger' && preparation.quantity === 10 && (
        <div className="flex justify-center gap-1 my-2">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="text-lg">🍔</span>
          ))}
        </div>
      )}
      <p className={cn(
        "text-xs font-bold uppercase mt-2",
        isReady ? "text-green-900" : "text-yellow-900"
      )}>
        {isReady ? 
          "Ready to move to warmer" : 
          `${remainingSeconds}s remaining`
        }
      </p>
    </div>
  );
};