import { inngest } from '@/inngest/client';
// TODO: Import these when implementing the exercise
// import { db } from '@/db';
// import { activePreparations } from '@/db/schema';
// import { FOOD_CONFIG } from '@/lib/constants';
// import type { InferInsertModel } from 'drizzle-orm';
// import { eq } from 'drizzle-orm';

export const prepareFood = inngest.createFunction(
  {
    id: 'prepare-food',
    name: 'Prepare Food Items',
    concurrency: {
      limit: 5, // Limit concurrent preparations
      key: 'event.data.foodType', // One preparation per food type at a time
    },
  },
  { event: 'food.prepare' },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ event, step }) => {
     
    const { foodType, quantity, batchId } = event.data;
    
    // TODO: Workshop Exercise - Implement the food preparation logic
    // This function receives a 'food.prepare' event from process-order.ts
    // when food needs to be prepared (burger and fries only - sodas are instant)
    
    // Step 1: Get food configuration
    // - Use FOOD_CONFIG[foodType] to get the configuration for this food type
    // - Extract prepTime (how long it takes to prepare)
    
    // Step 2: Create active preparation record
    // - Use step.run('create-preparation', async () => { ... })
    // - Insert a new record into the activePreparations table with:
    //   - foodType: from the event
    //   - quantity: from the event (this is the total batch quantity)
    //   - status: 'preparing'
    //   - completesAt: current time + prepTime
    // - Return the created preparation record
    
    // Step 3: Simulate cooking time (hint: `step.sleep`)
    
    // Step 4: Mark preparation as ready
    // - Use step.run('mark-preparation-ready', async () => { ... })
    // - Update the activePreparations record
    // - Set status to 'ready'
    // - Use the preparation.id from Step 2
    
    // Step 5: Dispatch event to add food to the warmer
    // - Send multiple 'warmer.item.add' events (as many as the batch size)
    // - The event should include:
    //   - foodType
    //   - orderId
    //   - batchId    
    // Note: Always include a name parameter when using step.sendEvent:
    // await step.sendEvent('Add item to warmer', {
    //   name: 'warmer.item.add',
    //   data: { ... }
    // });
    
    // Step 6: Remove from active preparations
    // - Use step.run('remove-preparation', async () => { ... })
    // - Delete the preparation record from activePreparations table
    // - Use the preparation.id from Step 2
    
    // Return the result
    return {
      preparationId: 0, // Replace with actual preparation.id
      foodType,
      quantity,
      batchId,
      prepTime: 0, // Replace with actual prepTime
      status: 'completed',
    };
  }
);