import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { createLlmConfig } from '@/lib/llm/config';
import { createLlmClient } from '@/lib/llm/llmApiInterfaces';
import { PromptHandler } from '@/lib/modules/promptHandler';
import { PromptInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    console.log(`[PlanStructure] Starting story structure planning for session ${sessionId}`);

    // Get story from database
    const story = await dbRepository.getStoryBySessionId(sessionId);
    if (!story) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if structure already exists
    if (story.story_structure) {
      console.log(`[PlanStructure] Story structure already exists for session ${sessionId}`);
      return NextResponse.json({ 
        success: true, 
        structure: story.story_structure,
        message: 'Story structure already generated'
      });
    }

    // Reconstruct prompt
    const prompt: PromptInput = {
      topic: story.topic,
      pages: story.total_pages,
      authorStyle: story.author_style || undefined,
      artStyle: story.art_style || undefined,
      readerVoice: story.reader_voice || undefined,
      quality: story.quality as 0 | 1 | 2
    };

    // Create LLM client and prompt handler
    const config = createLlmConfig();
    const llmClient = createLlmClient(config);
    const promptHandler = new PromptHandler();

    // Generate story structure with reduced timeout for Vercel limits
    const systemPrompt = promptHandler.createStoryStructureSystemPrompt(prompt);
    const userPrompt = promptHandler.createStoryStructureUserPrompt(prompt);

    console.log(`[PlanStructure] Generating structure with 50s timeout`);
    
    const startTime = Date.now();
    const response = await llmClient.generateContentWithFallback(
      userPrompt,
      systemPrompt,
      'storyPlanning'
    );
    const duration = Date.now() - startTime;

    console.log(`[PlanStructure] Structure generated in ${duration}ms`);

    // Save structure to database
    const storyStructure = response.content;
    await dbRepository.updateStoryProgress(story.id, { 
      currentStep: 'planning',
      storyStructure 
    });

    console.log(`[PlanStructure] Story structure saved for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      structure: storyStructure,
      duration,
      nextStep: 'plan-characters'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PlanStructure] Error generating story structure for session ${sessionId}:`, errorMessage);

    // Update story status
    try {
      const story = await dbRepository.getStoryBySessionId(sessionId);
      if (story) {
        await dbRepository.updateStoryStatus(story.id, 'failed', `Structure planning failed: ${errorMessage}`);
      }
    } catch (dbError) {
      console.error('[PlanStructure] Failed to update database status:', dbError);
    }

    return NextResponse.json({
      error: 'Failed to generate story structure',
      details: errorMessage
    }, { status: 500 });
  }
} 