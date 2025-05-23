// /src/app/api/story/generate/route.ts

import { sessionManager } from "@/lib/session/sessionManager";
import { PromptInput, StartStoryResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest): Promise<NextResponse> {
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

        if (body.topic.length > 500) {
            return NextResponse.json(
                { error: 'Topic must be less than 500 characters' },
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

        // Create session using session manager
        const session = sessionManager.createSession({ prompt });

        // TODO: Start story generation process here
        console.log(`Story generation started for session ${session.sessionId}`);
        console.log(`Topic: "${prompt.topic}", Pages: ${prompt.pages}, Quality: ${prompt.quality}`);

        // Return response
        const response: StartStoryResponse = {
            sessionId: session.sessionId,
            storyId: session.storyId,
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