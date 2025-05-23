// /src/app/api/story/generate/route.ts

import { PromptInput, StartStoryResponse, StorySession } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';





// For now, StorySession could be defined here, but must later be moved to proper session manager
const activeSessions = new Map<string, StorySession>();
// activeSessions will handle in-memory session storage


export async function POST(request: NextRequest) {
    // Validate the request body
    let body: PromptInput;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON' },
            { status: 400 }
        );
    }

    try {
        // Validate the required fields
        if (!body.topic || !body.pages || body.quality === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: topic, pages, quality' },
                { status: 400 }
            );
        }

        // Constrain pages: 1-50
        if (body.pages < 1 || body.pages > 50) {
            return NextResponse.json(
                { error: 'Pages must be between 1 and 50' },
                { status: 400 }
            );
        }

        // Create validated prompt object
        const prompt: PromptInput = {
            topic: body.topic.trim(),
            pages: body.pages,
            authorStyle: typeof body.authorStyle === 'string' ? body.authorStyle.trim() : undefined,
            quality: body.quality as 0 | 1 | 2,
            artStyle: typeof body.artStyle === 'string' ? body.artStyle.trim() : undefined,
            readerVoice: typeof body.readerVoice === 'string' ? body.readerVoice.trim() : undefined,
        };

        // Generate unqiue IDs
        const sessionId = uuidv4();
        const storyId = uuidv4();

        // Create session
        const session: StorySession = {
            sessionId,
            storyId,
            status: 'pending',
            prompt,
            createdAt: new Date(),
            updatedAt: new Date(),
            progress: {
                currentPage: 0,
                totalPages: prompt.pages,
                completedPages: 0,
                currentStep: 'planning',
            },
        };

        // Store session
        activeSessions.set(sessionId, session);

        // TODO: Start story generation process
        console.log(`Story generation started for session ${sessionId}`);

        // Return session info
        const response: StartStoryResponse = {
            sessionId,
            storyId,
            status: session.status,
            message: 'Story generation started successfully',
            progress: session.progress,
        };

        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        console.error('Error getting session status', error);
        return NextResponse.json(
            { error: 'Failed to get session status' },
            { status: 500 }
        );
    }
}