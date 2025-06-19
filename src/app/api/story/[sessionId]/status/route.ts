// /src/app/api/story/[sessionId]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const { sessionId } = await params;
    
    // Debug logging for incoming requests
    console.log(`[Status API] GET request for session: ${sessionId}`);

    // Validate sessionId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      console.log(`[Status API] Invalid session ID format: ${sessionId}`);
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const storyData = await dbRepository.getStoryWithPages(sessionId);
    
    if (!storyData) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    const { story, pages } = storyData;

    // Calculate progress
    const completedPages = pages.filter(p => p.status === 'completed');
    const currentPage = pages.find(p => 
      p.status !== 'pending' && p.status !== 'completed'
    );

    // Get available content for completed pages
    const availableContent = completedPages.map(page => ({
      pageIndex: page.page_index,
      content: page.content_text,
      contentLength: page.content_length || 0,
      iteration: page.iteration,
      completedAt: page.completed_at
    }));

    // Debug logging for status endpoint
    console.log(`[Status API] Session: ${sessionId}, Status: ${story.status}, Completed: ${completedPages.length}/${story.total_pages}`);
    console.log(`[Status API] Story updated_at: ${story.updated_at}`);

    const response = {
      sessionId,
      storyId: story.id,
      status: story.status,
      progress: {
        currentPage: currentPage?.page_index || 0,
        totalPages: story.total_pages,
        completedPages: completedPages.length,
        currentStep: story.current_step
      },
      prompt: {
        topic: story.topic,
        pages: story.total_pages,
        authorStyle: story.author_style,
        artStyle: story.art_style,
        readerVoice: story.reader_voice,
        quality: story.quality
      },
      content: {
        storyPlan: story.story_plan,
        pages: availableContent
      },
      createdAt: story.created_at,
      updatedAt: story.updated_at,
      completedAt: story.completed_at,
      error: story.error_message
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching story status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story status' },
      { status: 500 }
    );
  }
}