// /src/app/api/story/[sessionId]/status/route.ts

import { GetStatusReponse, StorySession } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";



// Import sessions (will come from session manager later)
declare const activeSessions: Map<string, StorySession>;


export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
    
    try {
        const { sessionId } = params;

        // Validate session ID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!sessionId || !uuidRegex.test(sessionId)) {
            return NextResponse.json(
                { error: 'Invalid session ID format' },
                { status: 400 }
            );
        }

        // Get session
        const session = activeSessions.get(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        const response: GetStatusReponse = {
            sessionId: session.sessionId,
            storyId: session.storyId,
            status: session.status,
            progress: session.progress,
            prompt: {
                topic: session.prompt.topic,
                pages: session.prompt.pages,
                authorStyle: session.prompt.authorStyle,
                quality: session.prompt.quality,
            },
            createdAt: session.createdAt,
            error: session.error,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error getting session status:', error);
        return NextResponse.json(
            { error: 'Failed to get session status' },
            { status: 500 }
        );
    }
}