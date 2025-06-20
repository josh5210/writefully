import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { storyService } from '@/lib/services/storyService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    console.log(`[GeneratePages] Starting page generation for session ${sessionId}`);

    // Get story from database
    const story = await dbRepository.getStoryBySessionId(sessionId);
    if (!story) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify story plan exists
    if (!story.story_plan) {
      return NextResponse.json({ 
        error: 'Cannot generate pages - missing story plan',
        message: 'Complete story planning first'
      }, { status: 400 });
    }

    // Check if pages are already being generated or completed
    if (story.status === 'generating') {
      console.log(`[GeneratePages] Story is already generating for session ${sessionId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Page generation already in progress',
        status: story.status
      });
    }

    if (story.status === 'completed') {
      console.log(`[GeneratePages] Story is already completed for session ${sessionId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Story generation already completed',
        status: story.status
      });
    }

    // Update status to generating and start the generation process
    await dbRepository.updateStoryStatus(story.id, 'generating');
    console.log(`[GeneratePages] Updated status to generating for session ${sessionId}`);

    // Start the page generation using the existing story service
    // This runs in the background and handles the full page generation pipeline
    console.log(`[GeneratePages] Starting story generation service for session ${sessionId}`);
    
    // Don't await this - let it run in background
    storyService.startGeneration(sessionId).catch((error) => {
      console.error(`[GeneratePages] Page generation failed for session ${sessionId}:`, error);
    });

    console.log(`[GeneratePages] Page generation initiated for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Page generation started successfully',
      status: 'generating',
      nextStep: 'complete'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[GeneratePages] Error starting page generation for session ${sessionId}:`, errorMessage);

    // Update story status
    try {
      const story = await dbRepository.getStoryBySessionId(sessionId);
      if (story) {
        await dbRepository.updateStoryStatus(story.id, 'failed', `Page generation failed: ${errorMessage}`);
      }
    } catch (dbError) {
      console.error('[GeneratePages] Failed to update database status:', dbError);
    }

    return NextResponse.json({
      error: 'Failed to start page generation',
      details: errorMessage
    }, { status: 500 });
  }
} 