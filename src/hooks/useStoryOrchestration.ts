import { useState, useCallback } from 'react';
import { 
  storyOrchestrationService, 
  StoryOrchestrationState
} from '@/lib/services/storyOrchestrationService';
import { SessionProgress } from '@/lib/types';

interface UseStoryOrchestrationResult {
  state: StoryOrchestrationState | null;
  isRunning: boolean;
  startOrchestration: (sessionId: string) => Promise<void>;
  cancelOrchestration: (sessionId: string) => Promise<void>;
  getStatus: (sessionId: string) => Promise<{ sessionId: string; storyId: string; status: string; progress: SessionProgress; error?: string; updatedAt: string }>;
  progress: {
    currentStep: string;
    percentage: number;
    totalDuration: number;
    estimatedTimeRemaining?: number;
  };
}

export function useStoryOrchestration(): UseStoryOrchestrationResult {
  const [state, setState] = useState<StoryOrchestrationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startOrchestration = useCallback(async (sessionId: string) => {
    setIsRunning(true);
    
    try {
      console.log(`[useStoryOrchestration] Starting orchestration for session ${sessionId}`);
      
      const result = await storyOrchestrationService.orchestrateStoryGeneration(
        sessionId,
        (progressState) => {
          setState(progressState);
          
          // Log progress for debugging
          const step = progressState.steps[progressState.currentStep];
          console.log(`[useStoryOrchestration] Progress: Step ${progressState.currentStep + 1}/${progressState.steps.length} - ${step?.name}`);
        }
      );

      setState(result);
      console.log(`[useStoryOrchestration] Orchestration completed with status: ${result.status}`);
      
    } catch (error) {
      console.error(`[useStoryOrchestration] Orchestration failed:`, error);
      
      // Create error state
      const errorState: StoryOrchestrationState = {
        sessionId,
        status: 'failed',
        currentStep: 0,
        steps: [],
        totalDuration: 0,
        error: error instanceof Error ? error.message : String(error)
      };
      
      setState(errorState);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const cancelOrchestration = useCallback(async (sessionId: string) => {
    try {
      await storyOrchestrationService.cancelStoryGeneration(sessionId);
      setIsRunning(false);
      
      if (state) {
        setState({
          ...state,
          status: 'failed',
          error: 'Cancelled by user'
        });
      }
      
    } catch (error) {
      console.error(`[useStoryOrchestration] Failed to cancel:`, error);
    }
  }, [state]);

  const getStatus = useCallback(async (sessionId: string) => {
    try {
      return await storyOrchestrationService.getStoryStatus(sessionId);
    } catch (error) {
      console.error(`[useStoryOrchestration] Failed to get status:`, error);
      throw error;
    }
  }, []);

  // Calculate progress metrics
  const progress = {
    currentStep: state?.steps[state.currentStep]?.name || 'Initializing...',
    percentage: state ? Math.round(((state.currentStep) / state.steps.length) * 100) : 0,
    totalDuration: state?.totalDuration || 0,
    estimatedTimeRemaining: state ? calculateEstimatedTimeRemaining(state) : undefined
  };

  return {
    state,
    isRunning,
    startOrchestration,
    cancelOrchestration,
    getStatus,
    progress
  };
}

/**
 * Calculate estimated time remaining based on completed steps
 */
function calculateEstimatedTimeRemaining(state: StoryOrchestrationState): number | undefined {
  const completedSteps = state.steps.filter(step => step.completed);
  
  if (completedSteps.length === 0) {
    return undefined; // Can't estimate without any completed steps
  }

  const averageStepDuration = completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0) / completedSteps.length;
  const remainingSteps = state.steps.length - state.currentStep - 1;
  
  return Math.round(averageStepDuration * remainingSteps);
} 