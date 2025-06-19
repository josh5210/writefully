// /src/app/api/story/[sessionId]/cancel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { storyService } from '@/lib/services/storyService';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const { sessionId } = await params;

    // Validate sessionId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Get story status first to validate
    const storyStatus = await storyService.getStoryStatus(sessionId);
    if (!storyStatus) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    if (storyStatus.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed story' },
        { status: 400 }
      );
    }

    if (storyStatus.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Story already cancelled' },
        { status: 400 }
      );
    }

    // Cancel the story using the story service
    await storyService.cancelGeneration(sessionId);

    console.log(`Story generation cancelled for session ${sessionId}`);

    return NextResponse.json({
      sessionId,
      status: 'cancelled',
      message: 'Story generation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling story generation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel story generation' },
      { status: 500 }
    );
  }
}