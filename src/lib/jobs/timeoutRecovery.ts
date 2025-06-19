// /src/lib/jobs/timeoutRecovery.ts
import { dbRepository } from '../db/repository';
import { DbStory, DbGenerationJob } from '../db/config';
import { DatabaseOrchestrator } from '../modules/databaseOrchestrator';
import { createOrchestrator } from '../modules/orchestratorFactory';
import { PromptInput } from '../types';

interface RecoveryJob {
  storyId: string;
  sessionId: string;
  orchestrator: DatabaseOrchestrator;
  retryCount: number;
}

class TimeoutRecoveryService {
  private activeRecoveries = new Map<string, RecoveryJob>();
  private recoveryInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting timeout recovery service...');

    // Check for timeouts every 30 seconds
    this.recoveryInterval = setInterval(() => {
      this.checkAndRecoverTimeouts().catch(error => {
        console.error('Error in timeout recovery:', error);
      });
    }, 30000);

    // Run initial check
    await this.checkAndRecoverTimeouts();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }

    // Cancel all active recoveries
    for (const [, job] of this.activeRecoveries) {
      job.orchestrator.cancelGeneration();
    }
    this.activeRecoveries.clear();

    console.log('Timeout recovery service stopped');
  }

  private async checkAndRecoverTimeouts(): Promise<void> {
    try {
      // Get all timed out jobs
      const timedOutJobs = await dbRepository.getTimedOutJobs();
      
      for (const job of timedOutJobs) {
        await this.handleTimeoutedJob(job);
      }

      // Clean up completed recoveries
      await this.cleanupCompletedRecoveries();

    } catch (error) {
      console.error('Error checking timeouts:', error);
    }
  }

  private async handleTimeoutedJob(job: DbGenerationJob): Promise<void> {
    try {
      // Mark job as timed out in database
      await dbRepository.markJobAsTimedOut(job.id);

      // Check if we're already recovering this story
      if (this.activeRecoveries.has(job.story_id)) {
        console.log(`Recovery already in progress for story ${job.story_id}`);
        return;
      }

      // Get story details
      const story = await dbRepository.getStoryBySessionId(job.story_id);
      if (!story) {
        console.error(`Story not found for job ${job.id}`);
        return;
      }

      // Check retry limits
      const MAX_RETRIES = 3;
      if (job.retry_count >= MAX_RETRIES) {
        console.log(`Max retries exceeded for job ${job.id}, marking story as failed`);
        await dbRepository.updateStoryStatus(story.id, 'failed', 
          `Generation failed after ${MAX_RETRIES} retries`);
        return;
      }

      console.log(`Starting recovery for story ${story.id} (session ${story.session_id})`);

      // Start recovery
      await this.startRecovery(story);

    } catch (error) {
      console.error(`Error handling timed out job ${job.id}:`, error);
    }
  }

  private async startRecovery(story: DbStory): Promise<void> {
    try {
      // Create new orchestrator for recovery
      const baseOrchestrator = createOrchestrator();
      
      // Extract modules using the getModules method
      const [storyPlanner, pagePlanner, writer, critic, editor] = baseOrchestrator.getModules();
      
      const orchestrator = new DatabaseOrchestrator(
        storyPlanner,
        pagePlanner,
        writer,
        critic,
        editor
      );

      // Reconstruct prompt from story data
      const prompt: PromptInput = {
        topic: story.topic,
        pages: story.total_pages,
        authorStyle: story.author_style || undefined,
        quality: story.quality as 0 | 1 | 2
      };

      // Store recovery job
      const recoveryJob: RecoveryJob = {
        storyId: story.id,
        sessionId: story.session_id,
        orchestrator,
        retryCount: story.retry_count + 1
      };

      this.activeRecoveries.set(story.id, recoveryJob);

      // Start recovery generation
      orchestrator.generateStory(prompt, story.session_id).catch(async (error) => {
        console.error(`Recovery failed for story ${story.id}:`, error);
        
        // Update retry count and potentially fail the story
        await dbRepository.updateStoryProgress(story.id, {});
        
        if (recoveryJob.retryCount >= 3) {
          await dbRepository.updateStoryStatus(story.id, 'failed', 
            `Recovery failed after ${recoveryJob.retryCount} attempts: ${error.message}`);
        }
        
        this.activeRecoveries.delete(story.id);
      }).then(async () => {
        console.log(`Recovery completed for story ${story.id}`);
        this.activeRecoveries.delete(story.id);
      });

    } catch (error) {
      console.error(`Error starting recovery for story ${story.id}:`, error);
    }
  }

  private async cleanupCompletedRecoveries(): Promise<void> {
    const completedRecoveries: string[] = [];

    for (const [storyId, job] of this.activeRecoveries) {
      try {
        const story = await dbRepository.getStoryBySessionId(job.sessionId);
        
        if (!story || ['completed', 'failed', 'cancelled'].includes(story.status)) {
          job.orchestrator.cancelGeneration();
          completedRecoveries.push(storyId);
        }
      } catch (error) {
        console.error(`Error checking recovery status for story ${storyId}:`, error);
        // Remove problematic recoveries
        completedRecoveries.push(storyId);
      }
    }

    // Remove completed recoveries
    for (const storyId of completedRecoveries) {
      this.activeRecoveries.delete(storyId);
    }
  }

  getActiveRecoveries(): string[] {
    return Array.from(this.activeRecoveries.keys());
  }
}

// Create singleton instance
export const timeoutRecoveryService = new TimeoutRecoveryService();
