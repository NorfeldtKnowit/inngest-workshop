import { db } from '@/db';
import { activePreparations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// DELETE /api/preparations/:id - Remove a preparation (used when moving to warmer)
export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return Response.json(
        { success: false, error: 'Invalid preparation ID' },
        { status: 400 }
      );
    }

    await db
      .delete(activePreparations)
      .where(eq(activePreparations.id, id));

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error removing preparation:', error);
    const response: FastFood['ApiResponse'] = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove preparation',
    };
    return Response.json(response, { status: 500 });
  }
};