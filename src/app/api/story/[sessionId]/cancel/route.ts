// /src/app/api/story/[sessionId]/cancel/route.ts

import { sessionManager } from "@/lib/session/sessionManager";
import { CancelStoryResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(
    request: NextRequest,
    { params }: { params: { sessionId: string }}
) {
    try {
        const { sessionId } = params;

        // Validate the sessionId format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!sessionId || !uuidRegex.test(sessionId)) {
            return NextResponse.json(
                { error: 'Invalid session ID format' },
                { status: 400 }
            );
        }

        // Get session from session manager
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Check if session can be cancelled
        if (session.status === 'completed') {
            return NextResponse.json(
                { error: 'Cannot cancel completed story' },
                { status: 400 }
            );
        }

        if (session.status === 'cancelled') {
            return NextResponse.json(
                { error: 'Story already cancelled' },
                { status: 400 }
            );
        }

        // Cancel session using session manager
        const cancelled = sessionManager.cancelSession(sessionId);
        if (!cancelled) {
            return NextResponse.json(
                { error: 'Failed to cancel session' },
                { status: 500 }
            );
        }

        // TODO: signal orchestrator to stop generation
        // This is where to call orchestrator.cancelGeneration()
        console.log(`Story generation cancelled for session ${sessionId}`);

        // Return confirmation
        const response: CancelStoryResponse = {
            sessionId: sessionId,
            status: session.status,
            message: 'Story generation cancelled successfully',
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error cancelling story generation:', error);
        return NextResponse.json(
            { error: 'Failed to cancel story generation' },
            { status: 500 }
        );
    }
}