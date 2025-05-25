// /src/app/api/story/[sessionId]/cancel/route.ts

import { storyService } from "@/lib/services/storyService";
import { sessionManager } from "@/lib/session/sessionManager";
import { CancelStoryResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(
    request: NextRequest,
    { params }: { params: { sessionId: string }}
): Promise<NextResponse> {
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

        // Cancel session using session manager and story service
        try {
            await storyService.cancelGeneration(sessionId);
            const cancelled = sessionManager.cancelSession(sessionId);

            if (!cancelled) {
                return NextResponse.json(
                    { error: 'Failed to cancel session' },
                    { status: 500 }
                );
            }

            console.log(`Story generation cancelled for session ${sessionId}`);

        } catch (error) {
            console.error('Error cancelling story generation:', error);

            // Still try to update session status even if orchestrator cancellation failed
            sessionManager.cancelSession(sessionId);
        }

        // Return response
        const response: CancelStoryResponse = {
            sessionId: sessionId,
            status: 'cancelled',
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