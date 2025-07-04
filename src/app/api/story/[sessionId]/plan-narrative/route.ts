import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
// import { createLlmConfig } from '@/lib/llm/config';
import { createFastLlmClient } from '@/lib/llm/llmApiInterfaces';
import { PromptHandler } from '@/lib/modules/promptHandler';
import { PromptInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    console.log(`[PlanNarrative] Starting narrative elements planning for session ${sessionId}`);

    // Get story from database
    const story = await dbRepository.getStoryBySessionId(sessionId);
    if (!story) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if narrative elements already exist
    if (story.story_narrative) {
      console.log(`[PlanNarrative] Story narrative already exists for session ${sessionId}`);
      return NextResponse.json({ 
        success: true, 
        narrative: story.story_narrative,
        message: 'Story narrative already generated'
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

    // Create fast LLM client and prompt handler for planning
    const llmClient = createFastLlmClient();
    const promptHandler = new PromptHandler();

    // Generate narrative elements with reduced timeout for Vercel limits
    const systemPrompt = promptHandler.createNarrativeElementsSystemPrompt(prompt);
    const userPrompt = promptHandler.createNarrativeElementsUserPrompt(prompt, 
      story.story_structure || '', 
      story.story_characters || '',
      story.story_settings || ''
    );

    console.log(`[PlanNarrative] Generating narrative elements with fast model: ${llmClient.getCurrentModelName()}`);
    
    const startTime = Date.now();
    const response = await llmClient.generateContentWithFallback(
      userPrompt,
      systemPrompt,
      'storyPlanning'
    );
    const duration = Date.now() - startTime;

    console.log(`[PlanNarrative] Narrative elements generated in ${duration}ms`);

    // Save narrative elements to database
    const storyNarrative = response.content;
    await dbRepository.updateStoryProgress(story.id, { 
      currentStep: 'planning',  // Use existing constraint value
      storyNarrative 
    });

    console.log(`[PlanNarrative] Story narrative saved for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      narrative: storyNarrative,
      duration,
      nextStep: 'integrate-plan'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PlanNarrative] Error generating narrative elements for session ${sessionId}:`, errorMessage);

    // Update story status
    try {
      const story = await dbRepository.getStoryBySessionId(sessionId);
      if (story) {
        await dbRepository.updateStoryStatus(story.id, 'failed', `Narrative planning failed: ${errorMessage}`);
      }
    } catch (dbError) {
      console.error('[PlanNarrative] Failed to update database status:', dbError);
    }

    return NextResponse.json({
      error: 'Failed to generate narrative elements',
      details: errorMessage
    }, { status: 500 });
  }
} 