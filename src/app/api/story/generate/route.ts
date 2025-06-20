// src/app/api/story/generate/route.ts
import { storyService } from "@/lib/services/storyService";
import { PromptInput } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Frontend sends the prompt directly, not wrapped in { request: ... }
        const promptInput: PromptInput = await request.json();

        console.log('Received request body:', promptInput);
        console.log('Topic present:', !!promptInput?.topic);
        console.log('Pages present:', !!promptInput?.pages);
        console.log('Topic value:', promptInput?.topic);
        console.log('Pages value:', promptInput?.pages);

        // Validate input
        if (!promptInput?.topic || !promptInput?.pages) {
            console.log('Validation failed - missing topic or pages');
            return NextResponse.json(
                { error: 'Topic and pages are required' },
                { status: 400 }
            );
        }

        if (promptInput.pages < 1 || promptInput.pages > 20) {
            console.log('Validation failed - pages out of range:', promptInput.pages);
            return NextResponse.json(
                { error: 'Pages must be between 1 and 20' },
                { status: 400 }
            );
        }

        console.log('Story generation initiated for session', promptInput.topic);
        console.log(`Topic "${promptInput.topic}", Pages: ${promptInput.pages}, Quality: ${promptInput.quality}`);

        // Create story session in database - this should be fast (< 5 seconds)
        const { sessionId, storyId, status } = await storyService.createStorySession(promptInput);

        console.log(`Story session created: ${sessionId}, ready for orchestrated generation`);

        // Return immediately - let frontend orchestrate the multi-stage process
        return NextResponse.json({
            sessionId,
            storyId,
            status,
            message: 'Story session created successfully. Use orchestration service to begin generation.',
            progress: {
                currentPage: 0,
                totalPages: promptInput.pages,
                completedPages: 0,
                currentStep: 'pending'
            },
            orchestrationRequired: true // Signal frontend to use orchestration
        }, { status: 201 });

    } catch (error) {
        console.error('Error in story generation:', error);
        
        return NextResponse.json({
            error: 'Failed to create story session',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}