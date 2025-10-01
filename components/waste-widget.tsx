'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
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

type AnimatedCounterProps = {
  value: number;
  className?: string;
};

const AnimatedCounter: FC<AnimatedCounterProps> = ({ value, className }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
};

export const WasteWidget: FC<WasteWidgetProps> = ({ wasteData }) => {
  const [prevByType, setPrevByType] = useState<Record<string, { quantity: number; count: number }>>({});

  useEffect(() => {
    if (wasteData?.statistics?.byType) {
      setPrevByType(wasteData.statistics.byType);
    }
  }, [wasteData?.statistics?.byType]);

  return (
    <div className="bg-red-100 border-2 border-red-800 shadow-[3px_3px_0px_rgba(153,27,27,0.8)] px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xl">🗑️</span>
          <span className="text-sm font-bold uppercase text-red-900">Waste</span>
        </div>

        <div className="flex items-center gap-3">
          <AnimatedCounter
            value={wasteData?.statistics?.totalWaste || 0}
            className="text-2xl font-bold text-red-900"
          />

          {wasteData?.statistics?.byType && Object.keys(wasteData.statistics.byType).length > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l-2 border-red-800">
              <AnimatePresence mode="popLayout">
                {Object.entries(wasteData.statistics.byType).map(([type, data]) => {
                  const isNew = !prevByType[type];

                  return (
                    <motion.div
                      key={type}
                      layout
                      initial={isNew ? { scale: 0, opacity: 0, y: -10 } : false}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0, y: 10 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        mass: 0.5
                      }}
                      className="flex items-center gap-1"
                    >
                      <motion.span
                        className="text-lg"
                        animate={isNew ? { rotate: [0, -10, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {FOOD_EMOJIS[type as keyof typeof FOOD_EMOJIS]}
                      </motion.span>
                      <AnimatedCounter
                        value={data.quantity}
                        className="text-sm font-bold text-red-900"
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};