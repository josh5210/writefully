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
    console.log(`[PlanSettings] Starting settings planning for session ${sessionId}`);

    // Get story from database
    const story = await dbRepository.getStoryBySessionId(sessionId);
    if (!story) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if settings already exist
    if (story.story_settings) {
      console.log(`[PlanSettings] Story settings already exist for session ${sessionId}`);
      return NextResponse.json({ 
        success: true, 
        settings: story.story_settings,
        message: 'Story settings already generated'
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

    // Generate story settings with reduced timeout for Vercel limits
    const systemPrompt = promptHandler.createSettingDevelopmentSystemPrompt(prompt);
    const userPrompt = promptHandler.createSettingDevelopmentUserPrompt(prompt, 
      story.story_structure || '', 
      story.story_characters || ''
    );

    console.log(`[PlanSettings] Generating settings with fast model: ${llmClient.getCurrentModelName()}`);
    
    const startTime = Date.now();
    const response = await llmClient.generateContentWithFallback(
      userPrompt,
      systemPrompt,
      'storyPlanning'
    );
    const duration = Date.now() - startTime;

    console.log(`[PlanSettings] Settings generated in ${duration}ms`);

    // Save settings to database
    const storySettings = response.content;
    await dbRepository.updateStoryProgress(story.id, { 
      currentStep: 'planning',  // Use existing constraint value
      storySettings 
    });

    console.log(`[PlanSettings] Story settings saved for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      settings: storySettings,
      duration,
      nextStep: 'plan-narrative'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PlanSettings] Error generating story settings for session ${sessionId}:`, errorMessage);

    // Update story status
    try {
      const story = await dbRepository.getStoryBySessionId(sessionId);
      if (story) {
        await dbRepository.updateStoryStatus(story.id, 'failed', `Settings planning failed: ${errorMessage}`);
      }
    } catch (dbError) {
      console.error('[PlanSettings] Failed to update database status:', dbError);
    }

    return NextResponse.json({
      error: 'Failed to generate story settings',
      details: errorMessage
    }, { status: 500 });
  }
} 