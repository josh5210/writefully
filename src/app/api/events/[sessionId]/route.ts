// /src/app/api/events/[sessionId]/route.ts

import { eventStreamer } from "@/lib/services/eventStreamer";
import { sessionManager } from "@/lib/session/sessionManager";
import { NextRequest, NextResponse } from "next/server";




export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
    try {
        const { sessionId } = await params;

        // Validate the session ID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!sessionId || !uuidRegex.test(sessionId)) {
            return NextResponse.json(
                { error: 'Invalid session ID format' },
                { status: 400 }
            );
        }

        // Verify session exists
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Set up SSE headers
        const headers = new Headers({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        });

        // Create readable stream for SSE
        const stream = new ReadableStream({
            start(controller) {
                console.log(`[SSE] Client connected to session ${sessionId}`);

                // Send initial connection event
                const connectEvent = `data: ${JSON.stringify({
                    type: 'connection',
                    sessionId,
                    timestamp: new Date().toISOString(),
                    message: 'Connected to event stream'
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(connectEvent));

                // Register client with event streamer
                eventStreamer.addClient(sessionId, controller);

                // Send current session state
                const stateEvent = `data: ${JSON.stringify({
                    type: 'session_state',
                    sessionId,
                    timestamp: new Date().toISOString(),
                    data: {
                        status: session.status,
                        progress: session.progress,
                        error: session.error
                    }
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(stateEvent));
            },
            cancel() {
                console.log(`[SSE] Client disconnected from session ${sessionId}`);
                eventStreamer.removeClient(sessionId);
            }
        });

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
            console.log(`[SSE] Request aborted for session ${sessionId}`);
            eventStreamer.removeClient(sessionId);
        });

        return new NextResponse(stream, { headers });

    } catch (error) {
        console.error('Error in SSE endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to establish event stream' },
            { status: 500 }
        );
    }
}