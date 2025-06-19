// /src/app/api/story/[sessionId]/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const { sessionId } = await params;
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get('since');
    const pageIndexParam = url.searchParams.get('pageIndex');

    // Validate sessionId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const story = await dbRepository.getStoryBySessionId(sessionId);
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    let pages = await dbRepository.getPagesByStoryId(story.id);

    // Filter by since timestamp if provided
    if (sinceParam) {
      const sinceDate = new Date(sinceParam);
      if (!isNaN(sinceDate.getTime())) {
        pages = pages.filter(page => page.updated_at > sinceDate);
      }
    }

    // Filter by specific page index if provided
    if (pageIndexParam) {
      const pageIndex = parseInt(pageIndexParam, 10);
      if (!isNaN(pageIndex)) {
        pages = pages.filter(page => page.page_index === pageIndex);
      }
    }

    const response = {
      sessionId,
      storyId: story.id,
      pages: pages.map(page => ({
        pageIndex: page.page_index,
        status: page.status,
        content: page.content_text,
        contentLength: page.content_length || 0,
        pagePlan: page.page_plan,
        critique: page.critique,
        iteration: page.iteration,
        startedAt: page.started_at,
        completedAt: page.completed_at,
        updatedAt: page.updated_at,
        retryCount: page.retry_count,
        error: page.error_message
      })),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching story pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story pages' },
      { status: 500 }
    );
  }
}