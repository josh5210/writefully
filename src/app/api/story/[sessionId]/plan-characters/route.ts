import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository';
import { createLlmConfig } from '@/lib/llm/config';
import { createLlmClient } from '@/lib/llm/llmApiInterfaces';
import { PromptHandler } from '@/lib/modules/promptHandler';
import { PromptInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = await params;

  try {
    console.log(`[PlanCharacters] Starting character planning for session ${sessionId}`);

    // Get story from database
    const story = await dbRepository.getStoryBySessionId(sessionId);
    if (!story) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if characters already exist
    if (story.story_characters) {
      console.log(`[PlanCharacters] Story characters already exist for session ${sessionId}`);
      return NextResponse.json({ 
        success: true, 
        characters: story.story_characters,
        message: 'Story characters already generated'
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

    // Generate character development with shortened timeout for Vercel
    const systemPrompt = promptHandler.createCharacterDevelopmentSystemPrompt(prompt);
    
    // Simplified user prompt for faster generation
    let userPrompt = `Create detailed character profiles for a ${prompt.pages}-page story about "${prompt.topic}"`;
    if (prompt.authorStyle) {
      userPrompt += ` in the style of ${prompt.authorStyle}`;
    }
    userPrompt += `.\n\nProvide:
    - Main character profiles with motivations and traits
    - Key supporting characters
    - Character relationships and conflicts
    - How characters evolve throughout the story`;

    console.log(`[PlanCharacters] Generating characters with 50s timeout`);
    
    const startTime = Date.now();
    const response = await llmClient.generateContentWithFallback(
      userPrompt,
      systemPrompt,
      'storyPlanning'
    );
    const duration = Date.now() - startTime;

    console.log(`[PlanCharacters] Characters generated in ${duration}ms`);

    // Save characters to database
    const storyCharacters = response.content;
    await dbRepository.updateStoryProgress(story.id, { 
      currentStep: 'planning',
      storyCharacters 
    });

    console.log(`[PlanCharacters] Story characters saved for session ${sessionId}`);

    return NextResponse.json({
      success: true,
      characters: storyCharacters,
      duration,
      nextStep: 'plan-settings'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PlanCharacters] Error generating characters for session ${sessionId}:`, errorMessage);

    // Update story status
    try {
      const story = await dbRepository.getStoryBySessionId(sessionId);
      if (story) {
        await dbRepository.updateStoryStatus(story.id, 'failed', `Character planning failed: ${errorMessage}`);
      }
    } catch (dbError) {
      console.error('[PlanCharacters] Failed to update database status:', dbError);
    }

    return NextResponse.json({
      error: 'Failed to generate story characters',
      details: errorMessage
    }, { status: 500 });
  }
} 