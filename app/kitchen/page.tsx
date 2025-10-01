'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { FOOD_EMOJIS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FoodWarmer } from '@/components/food-warmer';
import { PreparationItem } from '@/components/preparation-item';
import { WasteWidget } from '@/components/waste-widget';
import { OrderTriggerButtons } from '@/components/order-trigger-buttons';
import { cn } from '@/lib/utils';

type Order = FastFood['Order'];
type FoodWarmerItem = FastFood['FoodWarmerItem'];
type ActivePreparation = FastFood['ActivePreparation'];

export default function KitchenDashboard() {
  const queryClient = useQueryClient();
  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      const response = await fetch('/api/orders');
      const result = await response.json() as FastFood['ApiResponse'];
      return result.data || [];
    },
    refetchInterval: 1000,
  });

  // Fetch food warmer items
  const { data: warmerItems = [] } = useQuery({
    queryKey: ['foodwarmer'],
    queryFn: async (): Promise<FoodWarmerItem[]> => {
      const response = await fetch('/api/foodwarmer');
      const result = await response.json() as FastFood['ApiResponse'];
      return result.data?.inventory || [];
    },
    refetchInterval: 1000,
  });

  // Fetch waste data
  const { data: wasteData } = useQuery({
    queryKey: ['waste'],
    queryFn: async () => {
      const response = await fetch('/api/waste');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 5000,
  });

  // Throttled invalidation when warmer state changes
  const lastInvalidationRef = useRef<number>(0);
  const warmerCountRef = useRef<number>(warmerItems.length);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastInvalidation = now - lastInvalidationRef.current;
    const warmerCountChanged = warmerCountRef.current !== warmerItems.length;

    // Invalidate waste query if warmer count changed and at least 500ms have passed
    if (warmerCountChanged && timeSinceLastInvalidation >= 500) {
      queryClient.invalidateQueries({ queryKey: ['waste'] });
      lastInvalidationRef.current = now;
    }

    warmerCountRef.current = warmerItems.length;
  }, [warmerItems.length, queryClient]);

  // Fetch active preparations
  const { data: preparations = [] } = useQuery({
    queryKey: ['preparations'],
    queryFn: async (): Promise<ActivePreparation[]> => {
      const response = await fetch('/api/preparations');
      const result = await response.json() as FastFood['ApiResponse'];
      return result.data || [];
    },
    refetchInterval: 500, // More frequent updates for countdown
  });

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'preparing': return 'default';
      case 'ready': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.PNG)',
          backgroundSize: '300px auto',
          backgroundPosition: 'top left',
          backgroundRepeat: 'repeat',
          transform: 'rotate(15deg) scale(1.5)',
          transformOrigin: 'center'
        }}
      />

      {/* Header */}
      <div className="relative z-10 border-b-4 border-yellow-900 bg-yellow-100 shadow-[0px_4px_0px_rgba(113,63,18,0.8)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-luckiest-guy uppercase tracking-wider" style={{ WebkitTextStroke: '3px #000000', paintOrder: 'stroke fill', letterSpacing: '0.1em' }}>
                <span className="text-orange-700">🍔 Sloppy Joe&apos;s</span> <span className="text-yellow-500">Burgers</span>
              </h1>
              <p className="text-yellow-900 font-bold">Real-time order management system</p>
            </div>
            <WasteWidget wasteData={wasteData} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Order Queue */}
          <Card className="lg:col-span-1 bg-green-200 border-2 border-green-800 shadow-[4px_4px_0px_rgba(22,101,52,0.8)]">
            <CardHeader className="pb-3 border-b-2 border-green-800">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <span className="text-2xl">📋</span>
                Order Queue
              </CardTitle>
              <CardDescription className="text-green-900 font-bold">
                {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} active orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders
                .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
                .map((order) => (
                  <div 
                    key={order.id} 
                    className="p-4 bg-white border-2 border-green-800 shadow-[3px_3px_0px_rgba(22,101,52,0.6)] hover:shadow-[1px_1px_0px_rgba(22,101,52,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-green-900 uppercase">
                        Order #{order.id} - Table {order.tableNumber}
                      </span>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {order.items.map((item: Order['items'][0]) => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "flex items-center gap-1 px-3 py-1 border-2 font-bold",
                            item.placedOnTray >= item.quantity 
                              ? "bg-green-300 border-green-800 text-green-900" 
                              : "bg-gray-200 border-gray-600 text-gray-700"
                          )}
                        >
                          <span className="text-lg">{FOOD_EMOJIS[item.foodType as keyof typeof FOOD_EMOJIS]}</span>
                          <span className="text-xs font-medium">
                            {item.placedOnTray}/{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 && (
                <div className="text-center py-16 text-green-700">
                  <span className="text-6xl mb-4 block">🍽️</span>
                  <p className="text-lg font-bold uppercase">No pending orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Preparations */}
          <Card className="lg:col-span-2 bg-yellow-200 border-2 border-yellow-800 shadow-[4px_4px_0px_rgba(113,63,18,0.8)]">
            <CardHeader className="pb-3 border-b-2 border-yellow-800">
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <span className="text-2xl">👨‍🍳</span>
                Active Preparations
              </CardTitle>
              <CardDescription className="text-yellow-900 font-bold">
                {preparations.length} batches in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preparations.length === 0 ? (
                <div className="text-center py-16 text-yellow-700">
                  <span className="text-6xl mb-4 block">⏸️</span>
                  <p className="text-lg font-bold uppercase">Kitchen is idle</p>
                  <p className="text-sm font-medium">Waiting for orders...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preparations.map(prep => (
                    <PreparationItem key={prep.id} preparation={prep} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Warmer */}
          <Card className="lg:col-span-1 bg-orange-200 border-2 border-orange-800 shadow-[4px_4px_0px_rgba(154,52,18,0.8)]">
            <CardHeader className="pb-3 border-b-2 border-orange-800">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <span className="text-2xl">🔥</span>
                Food Warmer
              </CardTitle>
              <CardDescription className="text-orange-900 font-bold">
                {warmerItems.length} items ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FoodWarmer items={warmerItems} />
            </CardContent>
          </Card>
        </div>

        {/* Workshop Event Triggers */}
        <div className="mt-6">
          <OrderTriggerButtons />
        </div>

      </div>
    </div>
  );
}