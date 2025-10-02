import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  processOrder,
  matchWarmerToOrders,
  prepareFood,
  warmerManagement,
  fulfillOrder,
} from '@/inngest/functions';

// Create the Inngest route handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processOrder,
    matchWarmerToOrders,
    prepareFood,
    warmerManagement,
    fulfillOrder,
  ],
});