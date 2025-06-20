export interface StoryOrchestrationStep {
  name: string;
  endpoint: string;
  completed: boolean;
  duration?: number;
  error?: string;
}

export interface StoryOrchestrationState {
  sessionId: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStep: number;
  steps: StoryOrchestrationStep[];
  totalDuration: number;
  error?: string;
}

export class StoryOrchestrationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  /**
   * Create the orchestration steps for story generation
   */
  private createOrchestrationSteps(sessionId: string): StoryOrchestrationStep[] {
    return [
      {
        name: 'Generate Story Structure',
        endpoint: `/api/story/${sessionId}/plan-structure`,
        completed: false
      },
      {
        name: 'Develop Characters', 
        endpoint: `/api/story/${sessionId}/plan-characters`,
        completed: false
      },
      {
        name: 'Create Settings',
        endpoint: `/api/story/${sessionId}/plan-settings`,
        completed: false
      },
      {
        name: 'Define Narrative Elements',
        endpoint: `/api/story/${sessionId}/plan-narrative`,
        completed: false
      },
      {
        name: 'Integrate Story Plan',
        endpoint: `/api/story/${sessionId}/integrate-plan`,
        completed: false
      },
      {
        name: 'Generate Pages',
        endpoint: `/api/story/${sessionId}/generate-pages`,
        completed: false
      }
    ];
  }

  /**
   * Start the multi-stage story generation process
   */
  async orchestrateStoryGeneration(
    sessionId: string,
    onProgress?: (state: StoryOrchestrationState) => void
  ): Promise<StoryOrchestrationState> {
    
    const state: StoryOrchestrationState = {
      sessionId,
      status: 'running',
      currentStep: 0,
      steps: this.createOrchestrationSteps(sessionId),
      totalDuration: 0
    };

    const overallStartTime = Date.now();

    try {
      console.log(`[StoryOrchestration] Starting orchestrated generation for session ${sessionId}`);
      
      // Execute each step sequentially
      for (let i = 0; i < state.steps.length; i++) {
        state.currentStep = i;
        const step = state.steps[i];
        
        console.log(`[StoryOrchestration] Step ${i + 1}/${state.steps.length}: ${step.name}`);
        
        // Update progress
        if (onProgress) {
          onProgress({ ...state });
        }

        // Execute the step
        const stepStartTime = Date.now();
        
        try {
          const response = await fetch(`${this.baseUrl}${step.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // No body needed - all data is in database
          });

          const stepEndTime = Date.now();
          step.duration = stepEndTime - stepStartTime;

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const result = await response.json();
          step.completed = true;
          
          console.log(`[StoryOrchestration] Step ${i + 1} completed in ${step.duration}ms`);

          // Check if we should continue to next step
          if (result.nextStep === 'complete') {
            console.log(`[StoryOrchestration] Generation complete at step ${i + 1}`);
            break;
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          step.error = errorMessage;
          state.error = `Failed at step ${i + 1}: ${step.name} - ${errorMessage}`;
          state.status = 'failed';
          
          console.error(`[StoryOrchestration] Step ${i + 1} failed:`, errorMessage);
          
          // Update final progress
          if (onProgress) {
            onProgress({ ...state });
          }
          
          return state;
        }
      }

      // All steps completed successfully
      state.status = 'completed';
      state.totalDuration = Date.now() - overallStartTime;
      
      console.log(`[StoryOrchestration] All steps completed in ${state.totalDuration}ms total`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      state.error = `Orchestration failed: ${errorMessage}`;
      state.status = 'failed';
      
      console.error(`[StoryOrchestration] Orchestration failed:`, errorMessage);
    }

    // Final progress update
    if (onProgress) {
      onProgress({ ...state });
    }

    return state;
  }

  /**
   * Get the current status of story generation
   */
  async getStoryStatus(sessionId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/story/${sessionId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[StoryOrchestration] Failed to get status for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel story generation
   */
  async cancelStoryGeneration(sessionId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/story/${sessionId}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[StoryOrchestration] Failed to cancel ${sessionId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const storyOrchestrationService = new StoryOrchestrationService(); 