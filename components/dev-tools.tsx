'use client';

import { cn } from '@/lib/utils';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

// Toast Component
const Toast: FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={cn(
        "animate-slide-down px-4 py-2 border-2 border-amber-800 shadow-[3px_3px_0px_rgba(120,53,15,0.6)] flex items-center gap-2 font-bold",
        toast.type === 'success' 
          ? 'bg-green-100 text-green-900' 
          : 'bg-red-100 text-red-900'
      )}
    >
      <span>{toast.message}</span>
    </div>
  );
};

// Toast Container
const ToastContainer: FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 space-y-2 z-[100]">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export const DevTools: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [counts, setCounts] = useState<{ orders: number; orderItems: number; foodWarmer: number; wasteLog: number; activePreparations: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch current counts
  const fetchCounts = async (): Promise<void> => {
    try {
      const res = await fetch('/api/dev/reset');
      const data = await res.json();
      if (data.success) {
        setCounts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCounts();
    }
  }, [isOpen]);

  // Remove toast
  const removeToast = (id: number): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Show toast message
  const showMessage = (msg: string): void => {
    const type = msg.startsWith('✅') ? 'success' : 'error';
    const newToast: Toast = {
      id: Date.now(),
      message: msg,
      type,
    };
    setToasts(prev => [...prev, newToast]);
  };

  // Add 1 burger order
  const addBurgerOrder = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Creating burger order...');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: Math.floor(Math.random() * 10) + 1,
          items: [{ foodType: 'burger', quantity: 1 }]
        }),
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) {
        showMessage(`❌ Error ${res.status}: ${data.error || 'Failed to create order'}`);
        console.error('Order creation failed:', data);
        return;
      }
      
      if (data.success && data.data) {
        showMessage(`✅ Created order #${data.data.id} with 1 burger`);
        await fetchCounts();
      } else {
        showMessage(`❌ Unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showMessage(`❌ Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove any order
  const removeAnyOrder = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // First get all orders
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      
      if (!ordersData.success || !ordersData.data || ordersData.data.length === 0) {
        showMessage('❌ No orders to remove');
        return;
      }
      
      // Find first non-delivered/non-cancelled order
      type Order = FastFood['Order'];
      const activeOrder = ordersData.data.find((order: Order) => 
        order.status !== 'delivered' && order.status !== 'cancelled'
      );
      
      if (!activeOrder) {
        showMessage('❌ No active orders to remove');
        return;
      }
      
      // Cancel that order
      const res = await fetch(`/api/orders/${activeOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      
      if (res.ok) {
        showMessage(`✅ Cancelled order #${activeOrder.id}`);
        await fetchCounts();
      }
    } catch {
      showMessage('❌ Failed to remove order');
    } finally {
      setIsLoading(false);
    }
  };

  // Add 1 burger to warmer
  const addBurgerToWarmer = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Adding burger to warmer...');
      const res = await fetch('/api/foodwarmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodType: 'burger', quantity: 1 }),
      });
      
      console.log('Warmer response status:', res.status);
      const data = await res.json();
      console.log('Warmer response data:', data);
      
      if (!res.ok) {
        showMessage(`❌ Error ${res.status}: ${data.error || 'Failed to add to warmer'}`);
        return;
      }
      
      if (data.success) {
        showMessage('✅ Added 1 burger to warmer');
        await fetchCounts();
      }
    } catch (error) {
      console.error('Error adding to warmer:', error);
      showMessage(`❌ Failed to add to warmer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove 1 burger from warmer
  const removeBurgerFromWarmer = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Removing burger from warmer...');
      const res = await fetch('/api/foodwarmer?foodType=burger&quantity=1', {
        method: 'DELETE',
      });
      
      const data = await res.json();
      console.log('Delete response:', res.status, data);
      
      if (res.ok && data.success) {
        showMessage('✅ Removed 1 burger from warmer');
        await fetchCounts();
      } else {
        showMessage(`❌ ${data.error || 'Failed to remove burger from warmer'}`);
      }
    } catch (error) {
      console.error('Error removing from warmer:', error);
      showMessage(`❌ Failed to remove from warmer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Place 1 burger on any order
  const placeBurgerOnOrder = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Get all orders
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      
      if (!ordersData.success || !ordersData.data) {
        showMessage('❌ Failed to get orders');
        return;
      }
      
      // Find first order with burgers that need to be placed
      type Order = FastFood['Order'];
      type OrderItem = FastFood['OrderItem'];
      let targetOrder: Order | null = null;
      let targetItem: OrderItem | null = null;
      
      for (const order of ordersData.data) {
        for (const item of order.items) {
          if (item.foodType === 'burger' && item.placedOnTray < item.quantity) {
            targetOrder = order;
            targetItem = item;
            break;
          }
        }
        if (targetItem) break;
      }
      
      if (!targetItem) {
        showMessage('❌ No burger orders need items placed');
        return;
      }
      
      // Place 1 burger on that order
      const res = await fetch(`/api/orders/${targetOrder.id}/items/${targetItem.id}/place`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1 }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        showMessage(`✅ Placed 1 burger on order #${targetOrder.id}`);
        await fetchCounts();
      } else {
        showMessage(`❌ Failed to place burger: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error placing burger on order:', error);
      showMessage(`❌ Failed to place burger on order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Start burger batch preparation
  const startBurgerBatch = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Starting burger batch preparation...');
      const res = await fetch('/api/preparations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          foodType: 'burger', 
          quantity: 5,
          prepTime: 3000 // 3 seconds
        }),
      });
      
      const data = await res.json();
      console.log('Preparation response:', data);
      
      if (res.ok && data.success) {
        showMessage(`✅ Started burger batch #${data.data.id}`);
      } else {
        showMessage(`❌ Failed to start batch: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting batch:', error);
      showMessage('❌ Failed to start burger batch');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove any burger batch
  const removeAnyBurgerBatch = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // First get all preparations
      const prepsRes = await fetch('/api/preparations');
      const prepsData = await prepsRes.json();
      
      if (!prepsData.success || !prepsData.data || prepsData.data.length === 0) {
        showMessage('❌ No burger batches to remove');
        return;
      }
      
      // Take the first preparation
      const firstPrep = prepsData.data[0];
      
      // Delete that preparation
      const res = await fetch(`/api/preparations/${firstPrep.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        showMessage(`✅ Removed burger batch #${firstPrep.id}`);
      } else {
        showMessage('❌ Failed to remove burger batch');
      }
    } catch (error) {
      console.error('Error removing burger batch:', error);
      showMessage('❌ Failed to remove burger batch');
    } finally {
      setIsLoading(false);
    }
  };

  // Add burger to waste
  const addBurgerToWaste = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Adding burger to waste...');
      const res = await fetch('/api/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          foodType: 'burger', 
          quantity: 1, 
          reason: 'mistake' 
        }),
      });
      
      console.log('Waste response status:', res.status);
      const data = await res.json();
      console.log('Waste response data:', data);
      
      if (!res.ok) {
        showMessage(`❌ Error ${res.status}: ${data.error || 'Failed to add to waste'}`);
        return;
      }
      
      if (data.success) {
        showMessage('✅ Added 1 burger to waste');
        await fetchCounts();
      }
    } catch (error) {
      console.error('Error adding to waste:', error);
      showMessage(`❌ Failed to add to waste: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database
  const resetDatabase = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dev/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: false }),
      });
      
      const data = await res.json();
      if (data.success) {
        showMessage('✅ Database reset');
        await fetchCounts();
      }
    } catch {
      showMessage('❌ Failed to reset database');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-amber-300 text-amber-900 px-4 py-2 border-2 border-amber-800 shadow-[4px_4px_0px_rgba(120,53,15,0.8)] hover:shadow-[2px_2px_0px_rgba(120,53,15,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-mono font-bold z-50"
          title="Open Dev Tools (Ctrl+Shift+D)"
        >
          🛠️ DEV TOOLS
        </button>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div ref={panelRef} className="fixed bottom-0 right-4 w-[350px] max-h-[90vh] bg-amber-50 border-2 border-amber-800 shadow-[8px_8px_0px_rgba(120,53,15,0.4)] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-amber-800 bg-amber-100 flex-shrink-0">
        <h2 className="text-lg font-bold text-amber-900 uppercase">🛠️ FastFood Dev Tools</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-2xl text-amber-900 hover:text-red-600 font-bold px-2 py-1 border-2 border-amber-800 bg-amber-200 shadow-[2px_2px_0px_rgba(120,53,15,0.8)] hover:shadow-[1px_1px_0px_rgba(120,53,15,0.8)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          title="Close (Ctrl+Shift+D)"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
        {/* Order Queue */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm flex items-center text-green-900 uppercase bg-green-100 px-3 py-1 border border-green-900 inline-block w-fit mb-3">
            <span className="text-xl mr-3">📋</span>
            Order Queue
          </h3>
          
          <button
            onClick={addBurgerOrder}
            disabled={isLoading}
            className="w-full bg-green-300 text-green-900 px-3 py-2 text-sm font-bold border-2 border-green-800 shadow-[3px_3px_0px_rgba(22,101,52,0.6)] hover:shadow-[1px_1px_0px_rgba(22,101,52,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➕ Add 1×🍔 Order
          </button>
          

          {/* Active Preparations */}
          <h3 className="font-bold text-sm flex items-center mt-6 text-yellow-900 uppercase bg-yellow-100 px-3 py-1 border border-yellow-900 inline-block w-fit mb-3">
            <span className="text-xl mr-3">👨‍🍳</span>
            Active Preparations
          </h3>
          
          <button
            onClick={startBurgerBatch}
            disabled={isLoading}
            className="w-full bg-yellow-300 text-yellow-900 px-3 py-2 text-sm font-bold border-2 border-yellow-800 shadow-[3px_3px_0px_rgba(113,63,18,0.6)] hover:shadow-[1px_1px_0px_rgba(113,63,18,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➕ Start Burger Batch
          </button>
          
          <button
            onClick={removeAnyBurgerBatch}
            disabled={isLoading}
            className="w-full bg-yellow-200 text-yellow-900 px-3 py-2 text-sm font-bold border-2 border-yellow-800 shadow-[3px_3px_0px_rgba(113,63,18,0.6)] hover:shadow-[1px_1px_0px_rgba(113,63,18,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➖ Remove Any Burger Batch
          </button>

          {/* Food Warmer */}
          <h3 className="font-bold text-sm flex items-center mt-6 text-orange-900 uppercase bg-orange-100 px-3 py-1 border border-orange-900 inline-block w-fit mb-3">
            <span className="text-xl mr-3">🔥</span>
            Food Warmer
          </h3>
          
          <button
            onClick={addBurgerToWarmer}
            disabled={isLoading}
            className="w-full bg-orange-300 text-orange-900 px-3 py-2 text-sm font-bold border-2 border-orange-800 shadow-[3px_3px_0px_rgba(154,52,18,0.6)] hover:shadow-[1px_1px_0px_rgba(154,52,18,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➕ Add 1×🍔 to Warmer
          </button>
          
          <button
            onClick={removeBurgerFromWarmer}
            disabled={isLoading}
            className="w-full bg-orange-200 text-orange-900 px-3 py-2 text-sm font-bold border-2 border-orange-800 shadow-[3px_3px_0px_rgba(154,52,18,0.6)] hover:shadow-[1px_1px_0px_rgba(154,52,18,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➖ Remove 1×🍔 from Warmer
          </button>

          <h3 className="font-bold text-sm flex items-center mt-6 text-blue-900 uppercase bg-blue-100 px-3 py-1 border border-blue-900 inline-block w-fit mb-3">
            <span className="text-xl mr-3">📋</span>
            Order Fulfillment
          </h3>
          
          <button
            onClick={placeBurgerOnOrder}
            disabled={isLoading}
            className="w-full bg-blue-300 text-blue-900 px-3 py-2 text-sm font-bold border-2 border-blue-800 shadow-[3px_3px_0px_rgba(30,64,175,0.6)] hover:shadow-[1px_1px_0px_rgba(30,64,175,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➕ Place 1×🍔 on Order
          </button>

          <button
            onClick={removeAnyOrder}
            disabled={isLoading}
            className="w-full bg-blue-200 text-blue-900 px-3 py-2 text-sm font-bold border-2 border-blue-800 shadow-[3px_3px_0px_rgba(30,64,175,0.6)] hover:shadow-[1px_1px_0px_rgba(30,64,175,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➖ Remove Any Order
          </button>

          {/* Waste Bin */}
          <h3 className="font-bold text-sm flex items-center mt-6 text-red-900 uppercase bg-red-100 px-3 py-1 border border-red-900 inline-block w-fit mb-3">
            <span className="text-xl mr-3">🗑️</span>
            Waste Bin
          </h3>
          
          <button
            onClick={addBurgerToWaste}
            disabled={isLoading}
            className="w-full bg-red-300 text-red-900 px-3 py-2 text-sm font-bold border-2 border-red-800 shadow-[3px_3px_0px_rgba(153,27,27,0.6)] hover:shadow-[1px_1px_0px_rgba(153,27,27,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            ➕ Add 1×🍔 to Waste
          </button>

          {/* System */}
          <h3 className="font-bold text-sm flex items-center mt-6 text-gray-900 uppercase bg-gray-100 px-3 py-1 border border-gray-900 inline-block w-fit mb-3">
            <span className="text-xl mr-3">🗄️</span>
            System
          </h3>
          
          <button
            onClick={resetDatabase}
            disabled={isLoading}
            className="w-full bg-gray-800 text-gray-100 px-3 py-2 text-sm font-bold border-2 border-gray-900 shadow-[3px_3px_0px_rgba(17,24,39,0.6)] hover:shadow-[1px_1px_0px_rgba(17,24,39,0.6)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
              🧹 Reset Database
          </button>
        </div>

      </div>
    </div>
    </>
  );
};