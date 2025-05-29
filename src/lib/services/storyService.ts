// /src/lib/services/storyService.ts

import { StoryEventHandler } from "../events/storyEventHandler";
import { Orchestrator } from "../modules/orchestrator";
import { createOrchestrator } from "../modules/orchestratorFactory";
import { sessionManager } from "../session/sessionManager";




// Track active orchestrators to enable cancellation
const activeOrchestrators = new Map<string, { orchestrator: Orchestrator; eventHandler: StoryEventHandler }>();


export class StoryService {

    // Start story generation for a session
    async startGeneration(sessionId: string): Promise<void> {
        try {
            // Get session to verify it exists and get prompt
            const session = sessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status !== 'pending') {
                throw new Error(`Cannot start generation for session with status: ${session.status}`);
            }

            console.log(`Starting story generation for session ${sessionId}`);
            console.log(`[${sessionId}] Topic: "${session.prompt.topic}", Pages: ${session.prompt.pages}, Quality: ${session.prompt.quality}`);

            // Create orchestrator
            console.log(`[${sessionId}] Creating orchestrator...`);
            const orchestrator = createOrchestrator();
            console.log(`[${sessionId}] Orchestrator created`);

            // Create event handler and attach to orchestrator
            const eventHandler = new StoryEventHandler(sessionId);
            eventHandler.attachToOrchestrator(orchestrator);

            // Store orchestrator for potential cancellation
            activeOrchestrators.set(sessionId, { orchestrator, eventHandler });

            // Start generation (without await, it runs in background)
            orchestrator.generateStory(session.prompt).catch((error) => {
                console.error(`Story generation failed for session ${sessionId}:`, error);
                sessionManager.setStatus(sessionId, 'failed', error.message);
                // Clean up
                activeOrchestrators.delete(sessionId);
            }).finally(() => {
                // Clean up on success or failure
                activeOrchestrators.delete(sessionId);
            });

            console.log(`Story generation started for session ${sessionId}`);

        } catch (error) {
            console.error(`Failed to start story generation for session ${sessionId}:`, error);
            sessionManager.setStatus(sessionId, 'failed', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }


    // Cancel story generation for a session
    async cancelGeneration(sessionId: string): Promise<void> {
        try {
            const activeGeneration = activeOrchestrators.get(sessionId);

            if (activeGeneration) {
                console.log(`Cancelling story generation for session ${sessionId}`);

                // Call orchestrator's cancel method
                activeGeneration.orchestrator.cancelGeneration();

                // Clean up
                activeOrchestrators.delete(sessionId);

                console.log(`Story generation cancelled for session ${sessionId}`);
            } else {
                console.log(`No active generation found for session ${sessionId}`);
            }

        } catch (error) {
            console.error(`Failed to cancel story generation for session ${sessionId}:`, error);
            throw error;
        }
    }


    // Get information about active generations
    getActiveGenerations(): { sessionId: string; startTime: Date }[] {
        const result: { sessionId: string; startTime: Date }[] = [];

        for (const [sessionId] of activeOrchestrators) {
            const session = sessionManager.getSession(sessionId);
            if (session) {
                result.push({
                    sessionId,
                    startTime: session.createdAt,
                });
            }
        }

        return result;
    }


    // Cleanup, for graceful shutdown
    async cleanup(): Promise<void> {
        console.log(`Cleaning up ${activeOrchestrators.size} active story generations...`);

        const cancellationPromises = Array.from(activeOrchestrators.keys()).map(
            sessionId => this.cancelGeneration(sessionId).catch(err =>
                console.error(`Failed to cancel session${sessionId}:`, err)
            )
        );

        await Promise.all(cancellationPromises);
        activeOrchestrators.clear();

        console.log('Story service cleanup complete');
    }
}


// Create singleton instance
export const storyService = new StoryService();
