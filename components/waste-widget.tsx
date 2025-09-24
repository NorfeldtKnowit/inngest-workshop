'use client';

import type { FC } from 'react';
import { FOOD_EMOJIS } from '@/lib/constants';

type WasteWidgetProps = {
  wasteData?: {
    logs: FastFood['WasteLog'][];
    statistics: {
      totalWaste: number;
      totalEntries: number;
      byType: Record<string, { quantity: number; count: number }>;
      byReason: Record<string, { quantity: number; count: number }>;
      dateRange: {
        start: Date | null;
        end: Date | null;
      };
    };
  };
};

export const WasteWidget: FC<WasteWidgetProps> = ({ wasteData }) => {
  return (
    <div className="bg-red-100 border-2 border-red-800 shadow-[3px_3px_0px_rgba(153,27,27,0.8)] px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xl">🗑️</span>
          <span className="text-sm font-bold uppercase text-red-900">Waste</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-red-900">
            {wasteData?.statistics?.totalWaste || 0}
          </span>
          
          {wasteData?.statistics?.byType && Object.keys(wasteData.statistics.byType).length > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l-2 border-red-800">
              {Object.entries(wasteData.statistics.byType).map(([type, data]) => (
                <div key={type} className="flex items-center gap-1">
                  <span className="text-lg">{FOOD_EMOJIS[type as keyof typeof FOOD_EMOJIS]}</span>
                  <span className="text-sm font-bold text-red-900">{data.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};