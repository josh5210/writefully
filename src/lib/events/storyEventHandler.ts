// /src/lib/events/storyEventHandler.ts

import { EventEmitter } from "stream";
import { StoryEvent } from "../modules/orchestrator";
import { sessionManager } from "../session/sessionManager";
import { Content } from "../types";


export class StoryEventHandler {

    constructor(private sessionId: string) {}

    // Attach event listeners to an orchestrator
    attachToOrchestrator(orchestrator: EventEmitter): void {
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
    }


    private handleStoryStarted(data: { totalPages: number }): void {
        console.log(`Story started for session ${this.sessionId} - ${data.totalPages} pages`);

        sessionManager.updateSession(this.sessionId, {
            status: 'generating',
            progress: {
                currentStep: 'planning',
            },
        });
    }


    private handleStoryPlanCreated(data: { storyPlan: string }): void {
        console.log(`Story plan created for session ${this.sessionId}`);

        // Can save story plan to db here in future
        sessionManager.updateProgress(this.sessionId, {
            currentStep: 'planning',
        });
    }


    private handlePagePlanCreated(data: { pageIndex: number; pagePlan: string }): void {
        console.log(`Page ${data.pageIndex + 1} plan created for session ${this.sessionId}`);

        sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'planning',
        });
    }


    private handlePageContentCreated(data: { pageIndex: number; content: Content }): void {
        console.log(`Page ${data.pageIndex + 1} content created for session ${this.sessionId}`);

        sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'writing',
        });
    }


    private handlePageCritiqueCreated(data: { pageIndex: number; critique: string }): void {
        console.log(`Page ${data.pageIndex + 1} critique created for session ${this.sessionId}`);

        sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'critiquing',
        });
    }


    private handlePageEdited(data: { pageIndex: number; content: Content }): void {
        console.log(`Page ${data.pageIndex + 1} edited for session ${this.sessionId}`);

        sessionManager.updateProgress(this.sessionId, {
            currentPage: data.pageIndex + 1,
            currentStep: 'editing',
        });
    }


    private handlePageCompleted(data: { pageIndex: number; content: Content; totalPages: number }): void {
        console.log(`Page ${data.pageIndex + 1} completed for session ${this.sessionId}`);

        const session = sessionManager.getSession(this.sessionId);
        if (!session) return;

        const completedPages = session.progress.completedPages + 1;
        const isStoryComplete = completedPages >= data.totalPages;

        sessionManager.updateProgress(this.sessionId, {
            completedPages,
            currentStep: isStoryComplete ? undefined : 'planning',
        });

        // TODO: In future, save the complteted page to database here
    }


    private handleStoryCompleted(data: { pages: Content[] }): void {
        console.log(`Story completed for session ${this.sessionId} - ${data.pages.length} pages`);

        sessionManager.setStatus(this.sessionId, 'completed');

        // TODO: Save complete story to database here
    }


    private handleError(data: { error: Error }): void {
        console.error(`Error in story generation for session ${this.sessionId}:`, data.error);

        sessionManager.setStatus(this.sessionId, 'failed', data.error.message);
    }
}
