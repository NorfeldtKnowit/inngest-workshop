'use client';

import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFoodWarmerCountdown } from '@/lib/hooks/use-food-warmer-countdown';

type FoodWarmerTimerProps = {
  expiresAt: Date;
  foodType: FastFood['FoodType'];
  shelfLife: number;
};

export const FoodWarmerTimer: FC<FoodWarmerTimerProps> = ({ expiresAt, shelfLife }) => {
  const { remainingSeconds, isExpired, isExpiring } = useFoodWarmerCountdown(expiresAt, shelfLife);

  return (
    <Badge 
      variant={isExpired ? "orange" : isExpiring ? "default" : "secondary"}
      className="text-xs font-mono tabular-nums"
    >
      {isExpired ? 
        `${Math.abs(remainingSeconds)}s EXPIRED` : 
        `${remainingSeconds}s`
      }
    </Badge>
  );
};