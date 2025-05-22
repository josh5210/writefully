// /src/lib/modules/orchestrator.ts

import EventEmitter from "events";
import { Content, PageContext, PromptInput } from "../types";
import { Critic } from "./critic";
import { Editor } from "./editor";
import { StoryPlanner } from "./storyPlanner";
import { Writer } from "./writer";
import { PagePlanner } from "./pagePlanner";


// Define story generation events
export enum StoryEvent {
    STORY_STARTED = 'story:started',
    STORY_PLAN_CREATED = 'story:plan:created',
    PAGE_PLAN_CREATED = 'page:plan:created',
    PAGE_CONTENT_CREATED = 'page:content:created',
    PAGE_CRITIQUE_CREATED = 'page:critique:created',
    PAGE_EDITED = 'page:edited',
    PAGE_COMPLETED = 'page:completed',
    STORY_COMPLETED = 'story:completed',
    ERROR = 'error'
}

// Define page generation state
export enum PageState {
    PLANNING = 'planning',
    WRITING = 'writing',
    CRITIQUING = 'critiquing',
    EDITING = 'editing',
    COMPLETED = 'completed'
}

// Stores state of the entire story generation process
export interface StoryGenerationState {
    storyPlan: string | null;
    pagePlans: Map<number, string>;
    pageContents: Map<number, Content>;
    pageCritiques: Map<number, string>;
    pageStates: Map<number, PageState>;
    completedPages: number[];
    currentPageIndex: number;
    totalPages: number;
    error: Error | null;
}


export class Orchestrator extends EventEmitter {
    private storyPlanner: StoryPlanner;
    private pagePlanner: PagePlanner;
    private writer: Writer;
    private critic: Critic;
    private editor: Editor;
    private state: StoryGenerationState;
    private prompt: PromptInput = {
        topic: '',
        pages: 1,
        quality: 0
    };
    private isGenerating: boolean = false;
    private shouldContinue: boolean = true;

    constructor(storyPlanner: StoryPlanner, pagePlanner: PagePlanner, writer: Writer, critic: Critic, editor: Editor) {
        super();
        this.storyPlanner = storyPlanner;
        this.pagePlanner = pagePlanner;
        this.writer = writer;
        this.critic = critic;
        this.editor = editor;

        // Initialize state
        this.state = {
            storyPlan: null,
            pagePlans: new Map(),
            pageContents: new Map(),
            pageCritiques: new Map(),
            pageStates: new Map(),
            completedPages: [],
            currentPageIndex: 0,
            totalPages: 0,
            error: null
        };
    }

    /**
     * Start generating a story
     * @param prompt User input params
     * @returns Promise resolves when entire story is complete
     */
    async generateStory(prompt: PromptInput): Promise<void> {
        if (this.isGenerating) {
            throw new Error('Story generation already in progress');
        }

        this.isGenerating = true;
        this.prompt = prompt;
        this.shouldContinue = true;

        // Reset state for new story
        this.resetState(prompt.pages);

        try {
            // Start the generation process
            this.emit(StoryEvent.STORY_STARTED, { totalPages: prompt.pages });

            // Generate story plan
            await this.generateStoryPlan();

            // Generate pages sequentially
            while (this.state.currentPageIndex < this.state.totalPages && this.shouldContinue) {
                await this.processPage(this.state.currentPageIndex);
                this.state.currentPageIndex++;
            }

            // Story is complete
            if (this.state.completedPages.length === this.state.totalPages) {
                this.emit(StoryEvent.STORY_COMPLETED, {
                    pages: Array.from(this.state.pageContents.values())
                });
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.state.error = err;
            this.emit(StoryEvent.ERROR, { error: err });
        } finally {
            this.isGenerating = false;
        }
    }


    /**
     * Reset state for a new story
     */
    private resetState(totalPages:number): void {
        this.state = {
            storyPlan: null,
            pagePlans: new Map(),
            pageContents: new Map(),
            pageCritiques: new Map(),
            pageStates: new Map(),
            completedPages: [],
            currentPageIndex: 0,
            totalPages,
            error: null
        };
    }


    // Simple helper to cancel current generation process
    cancelGeneration(): void {
        this.shouldContinue = false;
    }


    /**
     * Use story planner module to generate the overall story plan
     */
    private async generateStoryPlan(): Promise<void> {
        try {
            const storyPlan = await this.storyPlanner.planStory(this.prompt);
            this.state.storyPlan = storyPlan;
            this.emit(StoryEvent.STORY_PLAN_CREATED, { storyPlan });
        } catch (error) {
            throw new Error(`Story planning failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    /**
     * Process a single page through the pipeline
     * @param pageIndex 0 based page index
     */
    private async processPage(pageIndex: number): Promise<void> {
        if (!this.state.storyPlan) {
            throw new Error('Story plan must be created before processing pages');
        }

        // Update page state
        this.state.pageStates.set(pageIndex, PageState.PLANNING);

        try {
            // 1. Plan the page
            const pagePlan = await this.planPage(pageIndex);

            // 2. Write the page
            this.state.pageStates.set(pageIndex, PageState.WRITING);
            const content = await this.writePage(pageIndex, pagePlan);

            // 3. Revision cycle (if quality setting requires it)
            let currentContent = content;
            let revisionCount = 0;

            while (revisionCount < this.prompt.quality && this.shouldContinue) {
                // 3a. Critique
                this.state.pageStates.set(pageIndex, PageState.CRITIQUING);
                const critique = await this.critiquePage(pageIndex, currentContent);

                // 3b. Edit
                this.state.pageStates.set(pageIndex, PageState.EDITING);
                currentContent = await this.editPage(pageIndex, currentContent, critique);

                revisionCount++;
            }

            // Page is complete
            this.state.pageStates.set(pageIndex, PageState.COMPLETED);
            this.state.completedPages.push(pageIndex);

            // Emit completion event
            this.emit(StoryEvent.PAGE_COMPLETED, {
                pageIndex,
                content: currentContent,
                totalPages: this.state.totalPages
            });

        } catch (error) {
            throw new Error(`Page ${pageIndex + 1} processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    /**
     * Plan a single page
     */
    private async planPage(pageIndex: number): Promise<string> {
        if (!this.state.storyPlan) {
            throw new Error('Story plan is required');
        }

        // Collect previous page plans for context
        const previousPagePlans: string[] = [];
        for (let i = 0; i < pageIndex; i++) {
            const plan = this.state.pagePlans.get(i);
            if (plan) previousPagePlans.push(plan);
        }

        // Create page context
        const pageContext: PageContext = {
            storyPlan: this.state.storyPlan,
            currentPageIndex: pageIndex,
            currentPagePlan: '',    // Will be populated by this function
            recentPreviousPagesFull: this.getRecentPreviousPages(pageIndex)
        };

        // Generate the page plan
        const pagePlan = await this.pagePlanner.planPage(
            this.prompt,
            pageContext,
            previousPagePlans
        );

        // Update state and emit event
        this.state.pagePlans.set(pageIndex, pagePlan);
        this.emit(StoryEvent.PAGE_PLAN_CREATED, { pageIndex, pagePlan });

        return pagePlan;
    }


    /**
     * Write content for a page
     */
    private async writePage(pageIndex: number, pagePlan: string): Promise<Content> {
        if (!this.state.storyPlan) {
            throw new Error('Story plan is required');
        }

        // Create page context
        const pageContext: PageContext = {
            storyPlan: this.state.storyPlan,
            currentPageIndex: pageIndex,
            currentPagePlan: pagePlan,
            recentPreviousPagesFull: this.getRecentPreviousPages(pageIndex)
        };

        // Generate content
        const content = await this.writer.write(this.prompt, pageContext);

        // Update state and emit event
        this.state.pageContents.set(pageIndex, content);
        this.emit(StoryEvent.PAGE_CONTENT_CREATED, { pageIndex, content });

        return content;
    }


    /**
     * Critique a page
     */
    private async critiquePage(pageIndex: number, content: Content): Promise<string> {
        if (!this.state.storyPlan || !this.state.pagePlans.get(pageIndex)) {
            throw new Error('Story plan and page plan are required');
        }

        // Create page context
        const pageContext: PageContext = {
            storyPlan: this.state.storyPlan,
            currentPageIndex: pageIndex,
            currentPagePlan: this.state.pagePlans.get(pageIndex) || '',
            recentPreviousPagesFull: this.getRecentPreviousPages(pageIndex)
        };

        // Generate critique
        const critique = await this.critic.evaluate(content, this.prompt, pageContext);

        // Update state and emit event
        this.state.pageCritiques.set(pageIndex, critique);
        this.emit(StoryEvent.PAGE_CRITIQUE_CREATED, { pageIndex, critique });

        return critique;
    }


    /**
     * Edit a page based on critique
     */
    private async editPage(pageIndex: number, content: Content, critique: string): Promise<Content> {
        if (!this.state.storyPlan || !this.state.pagePlans.get(pageIndex)) {
            throw new Error('Story plan and page plan are required');
        }

        // Create page context
        const pageContext: PageContext = {
            storyPlan: this.state.storyPlan,
            currentPageIndex: pageIndex,
            currentPagePlan: this.state.pagePlans.get(pageIndex) || '',
            recentPreviousPagesFull: this.getRecentPreviousPages(pageIndex)
        };

        // Generate edited content
        const editedContent = await this.editor.edit(content, this.prompt, critique, pageContext);

        // Update state and emit event
        this.state.pageContents.set(pageIndex, editedContent);
        this.emit(StoryEvent.PAGE_EDITED, { pageIndex, content: editedContent });

        return editedContent;
    }


    /**
     * Get the most recent previous pages for context
     * Limits to last 2 pages to keep context manageable
     */
    private getRecentPreviousPages(currentPageIndex: number): Content[] {
        const previousPages: Content[] = [];

        // Get up to 2 most recent pages
        for (let i = Math.max(0, currentPageIndex - 2); i < currentPageIndex; i++) {
            const pageContent = this.state.pageContents.get(i);
            if (pageContent) {
                previousPages.push(pageContent);
            }
        }

        return previousPages;
    }


    /**
     * Get the current state of story generation process
     */
    getState(): StoryGenerationState {
        return { ...this.state };
    }


    /**
     * Get all completed pages
     */
    getCompletedPages(): Content[] {
        const completedPages: Content[] = [];

        for (let i = 0; i < this.state.totalPages; i++) {
            if (this.state.pageStates.get(i) === PageState.COMPLETED) {
                const content = this.state.pageContents.get(i);
                if (content) {
                    completedPages.push(content);
                }
            }
        }

        return completedPages;
    }
}