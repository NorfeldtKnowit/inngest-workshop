'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FOOD_EMOJIS } from '@/lib/constants';
import { useState } from 'react';

export const OrderTriggerButtons: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  const generateOrderId = () => Math.floor(100000 + Math.random() * 900000);

  const sendOrderEvent = async (items: Array<{ foodType: FastFood['FoodType']; quantity: number }>) => {
    setIsLoading(true);
    try {
      const orderId = generateOrderId();
      
      // Send event via API endpoint
      const response = await fetch('/api/events/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: 'Workshop Test',
          tableNumber: Math.floor(Math.random() * 10) + 1, // Random table 1-10
          items,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send order event');
      }

      setLastOrder(`Order #${orderId} sent!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setLastOrder(null), 3000);
    } catch (error) {
      console.error('Failed to send order event:', error);
      setLastOrder('Failed to send order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-purple-200 border-2 border-purple-800 shadow-[4px_4px_0px_rgba(88,28,135,0.8)]">
      <CardHeader className="pb-3 border-b-2 border-purple-800">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <span className="text-2xl">🎯</span>
          Workshop Event Triggers
        </CardTitle>
        <CardDescription className="text-purple-900 font-bold">
          Click to dispatch order events directly to Inngest
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => sendOrderEvent([{ foodType: 'burger', quantity: 1 }])}
            disabled={isLoading}
            className="bg-red-300 hover:bg-red-400 text-red-900 font-bold py-4 px-4 text-base border-2 border-red-800 shadow-[3px_3px_0px_rgba(153,27,27,0.8)] hover:shadow-[1px_1px_0px_rgba(153,27,27,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl mr-2">{FOOD_EMOJIS.burger}</span>
            Order Burger
          </button>

          <button
            onClick={() => sendOrderEvent([
              { foodType: 'burger', quantity: 1 },
              { foodType: 'fries', quantity: 1 }
            ])}
            disabled={isLoading}
            className="bg-orange-300 hover:bg-orange-400 text-orange-900 font-bold py-4 px-4 text-base border-2 border-orange-800 shadow-[3px_3px_0px_rgba(154,52,18,0.8)] hover:shadow-[1px_1px_0px_rgba(154,52,18,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl mr-2">
              {FOOD_EMOJIS.burger}{FOOD_EMOJIS.fries}
            </span>
            Burger + Fries
          </button>

          <button
            onClick={() => sendOrderEvent([
              { foodType: 'burger', quantity: 1 },
              { foodType: 'fries', quantity: 1 },
              { foodType: 'soda', quantity: 1 }
            ])}
            disabled={isLoading}
            className="bg-blue-300 hover:bg-blue-400 text-blue-900 font-bold py-4 px-4 text-base border-2 border-blue-800 shadow-[3px_3px_0px_rgba(30,58,138,0.8)] hover:shadow-[1px_1px_0px_rgba(30,58,138,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl mr-2">
              {FOOD_EMOJIS.burger}{FOOD_EMOJIS.fries}{FOOD_EMOJIS.soda}
            </span>
            Full Meal
          </button>
        </div>

        {lastOrder && (
          <div className="mt-4 p-3 bg-green-300 border-2 border-green-800 text-green-900 font-bold text-center animate-pulse">
            {lastOrder}
          </div>
        )}

        <div className="mt-4 p-3 bg-purple-300 border-2 border-purple-700 text-purple-900 text-sm font-medium">
          <strong>Note:</strong> These buttons send order.created events directly to Inngest. 
          The process-order function will handle creating the order in the database. It is your task to finish the entire kitchenworkflow by orchestrating it with inngest.
        </div>
      </CardContent>
    </Card>
  );
};