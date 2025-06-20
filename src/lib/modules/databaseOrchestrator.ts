// lib/modules/databaseOrchestrator.ts
import EventEmitter from "events";
import { Content, PageContext, PromptInput } from "../types";
import { Critic } from "./critic";
import { Editor } from "./editor";
import { StoryPlanner } from "./storyPlanner";
import { Writer } from "./writer";
import { PagePlanner } from "./pagePlanner";
import { dbRepository } from "../db/repository";
import { DbStory, DbPage, DbGenerationJob } from "../db/config";

// Re-export events for compatibility
export { StoryEvent } from "./orchestrator";

interface DatabaseOrchestratorState {
  storyId: string;
  sessionId: string;
  story: DbStory | null;
  pages: DbPage[];
  isGenerating: boolean;
  shouldContinue: boolean;
}

export class DatabaseOrchestrator extends EventEmitter {
  private storyPlanner: StoryPlanner;
  private pagePlanner: PagePlanner;
  private writer: Writer;
  private critic: Critic;
  private editor: Editor;
  private state: DatabaseOrchestratorState;

  constructor(
    storyPlanner: StoryPlanner, 
    pagePlanner: PagePlanner, 
    writer: Writer, 
    critic: Critic, 
    editor: Editor
  ) {
    super();
    this.storyPlanner = storyPlanner;
    this.pagePlanner = pagePlanner;
    this.writer = writer;
    this.critic = critic;
    this.editor = editor;

    this.state = {
      storyId: '',
      sessionId: '',
      story: null,
      pages: [],
      isGenerating: false,
      shouldContinue: true
    };
  }

  async generateStory(prompt: PromptInput, sessionId: string): Promise<void> {
    if (this.state.isGenerating) {
      throw new Error('Story generation already in progress');
    }

    this.state.isGenerating = true;
    this.state.shouldContinue = true;
    this.state.sessionId = sessionId;

    try {
      // Check if story already exists (recovery scenario)
      const storyData = await dbRepository.getStoryWithPages(sessionId);
      
      if (!storyData) {
        // Create new story
        const story = await dbRepository.createStory(sessionId, prompt);
        this.state.storyId = story.id;
        this.state.story = story;
        this.state.pages = [];

        // Create page records
        for (let i = 0; i < prompt.pages; i++) {
          const page = await dbRepository.createPage(story.id, i);
          this.state.pages.push(page);
        }
      } else {
        // Resume existing story
        this.state.storyId = storyData.story.id;
        this.state.story = storyData.story;
        this.state.pages = storyData.pages;
        console.log(`Resuming story generation for session ${sessionId}`);
      }

      // Update story status to generating
      await dbRepository.updateStoryStatus(this.state.storyId, 'generating');
      this.emit('story:started', { totalPages: prompt.pages });

      // Process story generation
      await this.processStoryGeneration(prompt);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.handleError(err);
    } finally {
      this.state.isGenerating = false;
    }
  }

  private async processStoryGeneration(prompt: PromptInput): Promise<void> {
    // Step 1: Generate story plan if not exists
    if (!this.state.story?.story_plan) {
      await this.generateStoryPlan(prompt);
    }

    // Step 2: Process pages sequentially
    for (let pageIndex = 0; pageIndex < prompt.pages && this.state.shouldContinue; pageIndex++) {
      await this.processPageWithRetry(pageIndex, prompt);
    }

    // Step 3: Check if story is complete
    const completedPages = this.state.pages.filter(p => p.status === 'completed').length;
    console.log(`[DatabaseOrchestrator] Story progress: ${completedPages}/${prompt.pages} pages completed`);
    
    if (completedPages === prompt.pages) {
      console.log(`[DatabaseOrchestrator] All pages completed, marking story as completed`);
      await this.completeStory();
    } else {
      console.log(`[DatabaseOrchestrator] Story incomplete: ${completedPages}/${prompt.pages} pages completed`);
    }
  }

  private async generateStoryPlan(prompt: PromptInput): Promise<void> {
    const jobId = await this.createGenerationJob('story_plan', null, { prompt });
    
    try {
      await dbRepository.startGenerationJob(jobId);
      
      // Reduced timeout from 55s to 45s to work better with tiered approach
      const storyPlan = await this.executeWithTimeout(
        () => this.storyPlanner.planStory(prompt),
        45000 // 45 seconds - allows for faster timeout and backup fallback
      );

      await dbRepository.updateStoryProgress(this.state.storyId, { storyPlan });
      await dbRepository.completeGenerationJob(jobId, { storyPlan });
      
      if (this.state.story) {
        this.state.story.story_plan = storyPlan;
      }
      
      this.emit('story:plan:created', { storyPlan });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[DatabaseOrchestrator] Story plan generation failed for story ${this.state.storyId}:`, errorMessage);
      
      // Enhanced error handling with more context
      if (errorMessage.includes('timed out')) {
        console.error(`[DatabaseOrchestrator] Story planning timed out - this may indicate LLM performance issues`);
      }
      
      await this.handleJobError(jobId, error);
      throw error;
    }
  }

  private async processPageWithRetry(pageIndex: number, prompt: PromptInput): Promise<void> {
    const page = this.state.pages[pageIndex];
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES && this.state.shouldContinue) {
      try {
        await this.processPage(pageIndex, prompt);
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;
        console.error(`Page ${pageIndex + 1} generation failed (attempt ${attempt}/${MAX_RETRIES}):`, error);
        
        await dbRepository.updatePageStatus(page.id, 'failed', 
          error instanceof Error ? error.message : String(error));

        if (attempt >= MAX_RETRIES) {
          throw new Error(`Page ${pageIndex + 1} failed after ${MAX_RETRIES} attempts`);
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  private async processPage(pageIndex: number, prompt: PromptInput): Promise<void> {
    const page = this.state.pages[pageIndex];
    
    // Skip if already completed
    if (page.status === 'completed') {
      console.log(`Page ${pageIndex + 1} already completed, skipping`);
      return;
    }

    console.log(`Processing page ${pageIndex + 1}`);

    // Step 1: Plan page (if not done)
    if (!page.page_plan) {
      await this.planPage(pageIndex, prompt);
    }

    // Step 2: Write content (if not done)
    if (!page.content_text) {
      await this.writePageContent(pageIndex, prompt);
    }

    // Step 3: Critique and edit (if quality > 0 and not done)
    if (prompt.quality > 0 && !page.critique) {
      await this.critiqueAndEditPage(pageIndex, prompt);
    }

    // Step 4: Mark as completed
    await dbRepository.updatePageStatus(page.id, 'completed');
    await dbRepository.updateStoryProgress(this.state.storyId, {
      completedPages: this.state.pages.filter(p => p.status === 'completed').length
    });

    // Update local state
    page.status = 'completed';

    // Convert to Content type for event
    const content = dbRepository.dbPageToContent(page);
    if (content) {
      this.emit('page:completed', { 
        pageIndex, 
        content, 
        totalPages: this.state.pages.length 
      });
    }
  }

  private async planPage(pageIndex: number, prompt: PromptInput): Promise<void> {
    const page = this.state.pages[pageIndex];
    const jobId = await this.createGenerationJob('page_plan', page.id, { pageIndex, prompt });

    try {
      await dbRepository.startGenerationJob(jobId);
      await dbRepository.updatePageStatus(page.id, 'planning');

      const pagePlan = await this.executeWithTimeout(
        () => this.createPagePlan(pageIndex, prompt),
        50000 // 50 seconds
      );

      await dbRepository.updatePageContent(page.id, { pagePlan });
      await dbRepository.completeGenerationJob(jobId, { pagePlan });
      
      page.page_plan = pagePlan;
      this.emit('page:plan:created', { pageIndex, pagePlan });

    } catch (error) {
      await this.handleJobError(jobId, error);
      throw error;
    }
  }

  private async writePageContent(pageIndex: number, prompt: PromptInput): Promise<void> {
    const page = this.state.pages[pageIndex];
    const jobId = await this.createGenerationJob('page_content', page.id, { pageIndex, prompt });

    try {
      await dbRepository.startGenerationJob(jobId);
      await dbRepository.updatePageStatus(page.id, 'writing');

      const content = await this.executeWithTimeout(
        () => this.createPageContent(pageIndex, prompt),
        50000 // 50 seconds
      );

      await dbRepository.updatePageContent(page.id, { contentText: content.text });
      await dbRepository.completeGenerationJob(jobId, { content: content.text });
      
      page.content_text = content.text;
      this.emit('page:content:created', { pageIndex, content });

    } catch (error) {
      await this.handleJobError(jobId, error);
      throw error;
    }
  }

  private async critiqueAndEditPage(pageIndex: number, prompt: PromptInput): Promise<void> {
    const page = this.state.pages[pageIndex];
    
    // Critique
    const critiqueJobId = await this.createGenerationJob('page_critique', page.id, { pageIndex, prompt });
    
    try {
      await dbRepository.startGenerationJob(critiqueJobId);
      await dbRepository.updatePageStatus(page.id, 'critiquing');

      const critique = await this.executeWithTimeout(
        () => this.createPageCritique(pageIndex, prompt),
        30000 // 30 seconds for critique
      );

      await dbRepository.updatePageContent(page.id, { critique });
      await dbRepository.completeGenerationJob(critiqueJobId, { critique });
      
      page.critique = critique;
      this.emit('page:critique:created', { pageIndex, critique });

    } catch (error) {
      await this.handleJobError(critiqueJobId, error);
      throw error;
    }

    // Edit
    const editJobId = await this.createGenerationJob('page_edit', page.id, { pageIndex, prompt });
    
    try {
      await dbRepository.startGenerationJob(editJobId);
      await dbRepository.updatePageStatus(page.id, 'editing');

      const editedContent = await this.executeWithTimeout(
        () => this.editPageContent(pageIndex, prompt),
        50000 // 50 seconds for editing
      );

      await dbRepository.updatePageContent(page.id, { 
        contentText: editedContent.text,
        iteration: (page.iteration || 1) + 1
      });
      await dbRepository.completeGenerationJob(editJobId, { content: editedContent.text });
      
      page.content_text = editedContent.text;
      page.iteration = (page.iteration || 1) + 1;
      this.emit('page:edited', { pageIndex, content: editedContent });

    } catch (error) {
      await this.handleJobError(editJobId, error);
      throw error;
    }
  }

  // Helper methods for actual content generation
  private async createPagePlan(pageIndex: number, prompt: PromptInput): Promise<string> {
    const context = this.getPageContext(pageIndex);
    return await this.pagePlanner.planPage(prompt, context);
  }

  private async createPageContent(pageIndex: number, prompt: PromptInput): Promise<Content> {
    const context = this.getPageContext(pageIndex);
    return await this.writer.write(prompt, context);
  }

  private async createPageCritique(pageIndex: number, prompt: PromptInput): Promise<string> {
    const page = this.state.pages[pageIndex];
    if (!page.content_text) throw new Error('No content to critique');
    
    const content = dbRepository.dbPageToContent(page);
    if (!content) throw new Error('Failed to convert page to content');
    
    const context = this.getPageContext(pageIndex);
    return await this.critic.evaluate(content, prompt, context);
  }

  private async editPageContent(pageIndex: number, prompt: PromptInput): Promise<Content> {
    const page = this.state.pages[pageIndex];
    if (!page.content_text || !page.critique) {
      throw new Error('Missing content or critique for editing');
    }
    
    const content = dbRepository.dbPageToContent(page);
    if (!content) throw new Error('Failed to convert page to content');
    
    const context = this.getPageContext(pageIndex);
    return await this.editor.edit(content, prompt, page.critique, context);
  }

  private getPageContext(pageIndex: number): PageContext {
    const recentPages: Content[] = [];
    
    // Get up to 2 previous completed pages
    for (let i = Math.max(0, pageIndex - 2); i < pageIndex; i++) {
      const page = this.state.pages[i];
      if (page.status === 'completed' && page.content_text) {
        const content = dbRepository.dbPageToContent(page);
        if (content) recentPages.push(content);
      }
    }

    return {
      storyPlan: this.state.story?.story_plan || '',
      currentPageIndex: pageIndex,
      currentPagePlan: this.state.pages[pageIndex]?.page_plan || '',
      recentPreviousPagesFull: recentPages
    };
  }

  private async createGenerationJob(
    jobType: DbGenerationJob['job_type'],
    pageId: string | null,
    inputData: Record<string, unknown>
  ): Promise<string> {
    const job = await dbRepository.createGenerationJob(
      this.state.storyId,
      jobType,
      pageId || undefined,
      inputData,
      5 // 5 minute timeout
    );
    return job.id;
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async handleJobError(jobId: string, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await dbRepository.failGenerationJob(jobId, errorMessage);
  }

  private async handleError(error: Error): Promise<void> {
    console.error(`Story generation error:`, error);
    await dbRepository.updateStoryStatus(this.state.storyId, 'failed', error.message);
    this.emit('error', { error });
  }

  private async completeStory(): Promise<void> {
    console.log(`[DatabaseOrchestrator] Completing story ${this.state.storyId}`);
    
    const updateResult = await dbRepository.updateStoryStatus(this.state.storyId, 'completed');
    console.log(`[DatabaseOrchestrator] Story status update result: ${updateResult}`);
    
    const completedPages = this.state.pages
      .filter(p => p.status === 'completed')
      .map(p => dbRepository.dbPageToContent(p))
      .filter((content): content is Content => content !== null);

    console.log(`[DatabaseOrchestrator] Emitting story:completed event for ${completedPages.length} pages`);
    this.emit('story:completed', { pages: completedPages });
  }

  cancelGeneration(): void {
    this.state.shouldContinue = false;
    if (this.state.storyId) {
      dbRepository.updateStoryStatus(this.state.storyId, 'cancelled');
    }
  }

  getCompletedPages(): Content[] {
    return this.state.pages
      .filter(p => p.status === 'completed')
      .map(p => dbRepository.dbPageToContent(p))
      .filter((content): content is Content => content !== null);
  }
}