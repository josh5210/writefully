// /src/lib/events/storyEventHandler.ts

import { EventEmitter } from "stream";
import { StoryEvent } from "../modules/orchestrator";
import { sessionManager } from "../session/sessionManager";
import { Content } from "../types";
import { eventStreamer } from "../services/eventStreamer";


export class StoryEventHandler {

    constructor(private sessionId: string) {}

    // Attach event listeners to an orchestrator
    attachToOrchestrator(orchestrator: EventEmitter): void {
        console.log(`Attaching event handlers to orchestrator for session ${this.sessionId}`);

        // Story lifecycle events
        orchestrator.on(StoryEvent.STORY_STARTED, this.handleStoryStarted.bind(this));
        orchestrator.on(StoryEvent.STORY_PLAN_CREATED, this.handleStoryPlanCreated.bind(this));
        orchestrator.on(StoryEvent.STORY_COMPLETED, this.handleStoryCompleted.bind(this));

        // Page lifecycle events
        orchestrator.on(StoryEvent.PAGE_PLAN_CREATED, this.handlePagePlanCreated.bind(this));
        orchestrator.on(StoryEvent.PAGE_CONTENT_CREATED, this.handlePageContentCreated.bind(this));
        orchestrator.on(StoryEvent.PAGE_CRITIQUE_CREATED, this.handlePageCritiqueCreated.bind(this));
        orchestrator.on(StoryEvent.PAGE_EDITED, this.handlePageEdited.bind(this));
        orchestrator.on(StoryEvent.PAGE_COMPLETED, this.handlePageCompleted.bind(this));

        // Error handling
        orchestrator.on(StoryEvent.ERROR, this.handleError.bind(this));

        console.log(`Event handlers attached for session ${this.sessionId}`);
    }


    private handleStoryStarted(data: { totalPages: number }): void {
        console.log(`Story started for session ${this.sessionId} - ${data.totalPages} pages`);

        const updated = sessionManager.updateSession(this.sessionId, {
            status: 'generating',
            progress: {
                currentStep: 'planning',
            },
        });

        if (updated) {
            console.log(`[${this.sessionId}] Session status updated to 'generating'`);
        } else {
            console.error(`[${this.sessionId}] Failed to update session status`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'story_started',
            data: {
                totalPages: data.totalPages,
                status: 'generating'
            },
            message: `Story generation started - ${data.totalPages} pages`
        });
    }


    private handleStoryPlanCreated(data: { storyPlan: string }): void {
        console.log(`Story plan created for session ${this.sessionId}`);

        // Can save story plan to db here in future

        const updated = sessionManager.updateProgress(this.sessionId, {
            currentStep: 'planning',
        });

        if (updated) {
            console.log(`[${this.sessionId}] Progress updated - story plan created`);
        } else {
            console.error(`[${this.sessionId}] Failed to update progress`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'story_plan_created',
            data: {
                planLength: data.storyPlan.length,
                currentStep: 'planning'
            },
            message: 'Story plan created'
        });
    }


    private handlePagePlanCreated(data: { pageIndex: number; pagePlan: string }): void {
        console.log(`Page ${data.pageIndex + 1} plan created for session ${this.sessionId}`);

        const updated = sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'planning',
        });

        if (updated) {
            console.log(`[${this.sessionId}] Progress updaged - page ${data.pageIndex + 1} planned`);
        } else {
            console.error(`[${this.sessionId}] Failed to update progress for page ${data.pageIndex + 1}`);
        }
    
        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'page_plan_created',
            data: {
                pageIndex: data.pageIndex,
                pageNumber: data.pageIndex + 1,
                planLength: data.pagePlan.length,
                currentStep: 'planning'
            },
            message: `Page ${data.pageIndex + 1} planned`
        });
    }


    private handlePageContentCreated(data: { pageIndex: number; content: Content }): void {
        console.log(`Page ${data.pageIndex + 1} content created for session ${this.sessionId}`);

        const updated = sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'writing',
        });

        if (updated) {
            console.log(`[${this.sessionId}] Progress updated - page ${data.pageIndex + 1} written`);
        } else {
            console.error(`[${this.sessionId}] Failed to update progress for page ${data.pageIndex + 1}`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'page_content_created',
            data: {
                pageIndex: data.pageIndex,
                pageNumber: data.pageIndex + 1,
                contentLength: data.content.text.length,
                currentStep: 'writing'
            },
            message: `Page ${data.pageIndex + 1} written`
        });
    }


    private handlePageCritiqueCreated(data: { pageIndex: number; critique: string }): void {
        console.log(`Page ${data.pageIndex + 1} critique created for session ${this.sessionId}`);

        const updated = sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'critiquing',
        });

        if (updated) {
            console.log(`[${this.sessionId}] Progress updated - page ${data.pageIndex + 1} critiqued`);
        } else {
            console.error(`[${this.sessionId}] Failed to update progress for page ${data.pageIndex + 1}`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'page_critique_created',
            data: {
                pageIndex: data.pageIndex,
                pageNumber: data.pageIndex + 1,
                critiqueLength: data.critique.length,
                currentStep: 'critiquing'
            },
            message: `Page ${data.pageIndex + 1} critiqued`
        });
    }


    private handlePageEdited(data: { pageIndex: number; content: Content }): void {
        console.log(`Page ${data.pageIndex + 1} edited for session ${this.sessionId}`);

        const updated = sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'editing',
        });

        if (updated) {
            console.log(`[${this.sessionId}] Progress updated - page ${data.pageIndex + 1} edited`);
        } else {
            console.error(`[${this.sessionId}] Failed to update progress for page ${data.pageIndex + 1}`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'page_edited',
            data: {
                pageIndex: data.pageIndex,
                pageNumber: data.pageIndex + 1,
                contentLength: data.content.text.length,
                iteration: data.content.metadata.iteration,
                currentStep: 'editing'
            },
            message: `Page ${data.pageIndex + 1} edited (iteration ${data.content.metadata.iteration})`
        });
    }


    private handlePageCompleted(data: { pageIndex: number; content: Content; totalPages: number }): void {
        console.log(`Page ${data.pageIndex + 1} completed for session ${this.sessionId}`);

        const session = sessionManager.getSession(this.sessionId);
        if (!session) {
            console.error(`[${this.sessionId}] Session not found when completing page`);
            return;
        };

        const completedPages = session.progress.completedPages + 1;
        const isStoryComplete = completedPages >= data.totalPages;

        const updated = sessionManager.updateProgress(this.sessionId, {
            completedPages,
            currentStep: isStoryComplete ? undefined : 'planning',
        });

        if (updated) {
            console.log(`[${this.sessionId}] Progress updated - ${completedPages}/${data.totalPages} pages completed`);
        } else {
            console.error(`[${this.sessionId}] Failed to update progress for completed page`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'page_completed',
            data: {
                pageIndex: data.pageIndex,
                pageNumber: data.pageIndex + 1,
                content: data.content.text,
                contentLength: data.content.text.length,
                completedPages: completedPages,
                totalPages: data.totalPages,
                isStoryComplete: isStoryComplete,
                currentStep: isStoryComplete ? 'completed' : 'planning'
            },
            message: `Page ${data.pageIndex + 1} completed (${completedPages}/${data.totalPages})`
        });

        // TODO: In future, save the complteted page to database here
    }


    private handleStoryCompleted(data: { pages: Content[] }): void {
        console.log(`Story completed for session ${this.sessionId} - ${data.pages.length} pages`);

        const updated = sessionManager.setStatus(this.sessionId, 'completed');

        if (updated) {
            console.log(`[${this.sessionId}] Session status updated to 'completed'`);
        } else {
            console.error(`[${this.sessionId}] Failed to update session status to completed`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'story_completed',
            data: {
                totalPages: data.pages.length,
                status: 'completed',
                pages: data.pages.map(page => ({
                    text: page.text,
                    length: page.text.length,
                    iteration: page.metadata.iteration,
                    timestamp: page.metadata.timestamp
                }))
            },
            message: `Story completed - ${data.pages.length} pages finished!`
        });

        // TODO: Save complete story to database here
    }


    private handleError(data: { error: Error }): void {
        console.error(`Error in story generation for session ${this.sessionId}:`, data.error);

        const updated = sessionManager.setStatus(this.sessionId, 'failed', data.error.message);

        if (updated) {
            console.log(`[${this.sessionId}] Session status updated to 'failed'`);
        } else {
            console.error(`[${this.sessionId}] Failed to update session status to failed`);
        }

        // Broadcast to SSE clients
        eventStreamer.broadcastToSession(this.sessionId, {
            type: 'error',
            data: {
                error: data.error.message,
                status: 'failed'
            },
            message: `Story generation failed: ${data.error.message}`
        });
    }
}
