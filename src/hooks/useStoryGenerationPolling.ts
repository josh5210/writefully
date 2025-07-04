// hooks/useStoryGenerationPolling.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { PromptInput } from '@/lib/types';

interface StoryProgress {
  currentPage: number;
  totalPages: number;
  completedPages: number;
  currentStep?: 'planning' | 'writing' | 'critiquing' | 'editing';
}

interface PageContent {
  pageIndex: number;
  content: string;
  contentLength: number;
  iteration: number;
  completedAt?: string;
}

interface StoryData {
  storyPlan?: string;
  pages: PageContent[];
}

interface StoryStatus {
  sessionId: string;
  storyId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progress: StoryProgress;
  content: StoryData;
  error?: string;
  updatedAt: string;
}

interface UseStoryGenerationPollingReturn {
  // State
  sessionId: string | null;
  status: 'idle' | 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  progress: StoryProgress;
  error: string | null;
  storyData: StoryData;
  isStarting: boolean;
  isCancelling: boolean;
  
  // Actions
  startGeneration: (prompt: PromptInput) => Promise<void>;
  cancelGeneration: () => Promise<void>;
  resetState: () => void;
  
  // Polling control
  pausePolling: () => void;
  resumePolling: () => void;
  isPolling: boolean;
}

export function useStoryGenerationPolling(): UseStoryGenerationPollingReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<UseStoryGenerationPollingReturn['status']>('idle');
  const [progress, setProgress] = useState<StoryProgress>({
    currentPage: 0,
    totalPages: 0,
    completedPages: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<StoryData>({ pages: [] });
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Refs for polling control
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);
  const lastUpdatedRef = useRef<string>('');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const resetState = useCallback(() => {
    setSessionId(null);
    setStatus('idle');
    setProgress({
      currentPage: 0,
      totalPages: 0,
      completedPages: 0,
    });
    setError(null);
    setStoryData({ pages: [] });
    setIsStarting(false);
    setIsCancelling(false);
    lastUpdatedRef.current = '';
    
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchStoryStatus = useCallback(async (sessionId: string): Promise<StoryStatus | null> => {
    try {
      const response = await fetch(`/api/story/${sessionId}/status`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Story not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch story status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching story status:', error);
      throw error;
    }
  }, []);

  const pollStoryStatus = useCallback(async () => {
    if (!sessionId || isPausedRef.current) return;

    try {
      const storyStatus = await fetchStoryStatus(sessionId);
      
      if (!storyStatus) return;

      // Add debugging for completion detection
      console.log(`[Polling] Status: ${storyStatus.status}, Updated: ${storyStatus.updatedAt}`);
      console.log(`[Polling] Progress: ${storyStatus.progress.completedPages}/${storyStatus.progress.totalPages} pages`);

      // Only update if data has changed
      if (storyStatus.updatedAt !== lastUpdatedRef.current) {
        lastUpdatedRef.current = storyStatus.updatedAt;

        console.log(`[Polling] Updating state - Status: ${storyStatus.status}`);
        
        // Safeguard: If all pages are completed but status is still generating, force completion
        if (storyStatus.status === 'generating' && 
            storyStatus.progress.completedPages >= storyStatus.progress.totalPages &&
            storyStatus.progress.totalPages > 0) {
          console.log(`[Polling] SAFEGUARD: All pages completed but status still generating - forcing completion`);
          setStatus('completed');
        } else {
          setStatus(storyStatus.status);
        }
        
        setProgress(storyStatus.progress);
        setStoryData(storyStatus.content);
        setError(storyStatus.error || null);

        // Stop polling if story is complete, failed, or cancelled
        if (['completed', 'failed', 'cancelled'].includes(storyStatus.status) ||
            (storyStatus.status === 'generating' && storyStatus.progress.completedPages >= storyStatus.progress.totalPages)) {
          console.log(`[Polling] Story ${storyStatus.status}, stopping polling`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setIsPolling(false);
          }
        }
      } else {
        console.log(`[Polling] No changes detected (same updatedAt: ${storyStatus.updatedAt})`);
      }

    } catch (error) {
      console.error('Polling error:', error);
      setError(error instanceof Error ? error.message : 'Polling failed');
      
      // Continue polling unless it's a fatal error (like 404)
      if (error instanceof Error && error.message.includes('not found')) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsPolling(false);
        }
        setStatus('failed');
      }
    }
  }, [sessionId, fetchStoryStatus]);

  const startPolling = useCallback((explicitSessionId?: string) => {
    const targetSessionId = explicitSessionId || sessionId;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    isPausedRef.current = false;
    lastUpdatedRef.current = '';

    if (!targetSessionId) {
      console.log(`[Polling] No sessionId available, cannot start polling`);
      return;
    }

    console.log(`[Polling] Starting polling interval for session: ${targetSessionId}`);
    
    // Create polling function that uses the target session ID
    const pollWithSessionId = async () => {
      if (isPausedRef.current) {
        console.log(`[Polling] Polling paused, skipping poll`);
        return;
      }

      try {
        const response = await fetch(`/api/story/${targetSessionId}/status`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: StoryStatus = await response.json();
        
        console.log(`[Polling] Status: ${data.status}, Updated: ${data.updatedAt}`);
        console.log(`[Polling] Progress: ${data.progress.completedPages}/${data.progress.totalPages} pages`);

        // Check if we've already processed this update
        if (lastUpdatedRef.current === data.updatedAt) {
          console.log(`[Polling] No changes detected (same updatedAt: ${data.updatedAt})`);
          return;
        }

        lastUpdatedRef.current = data.updatedAt;

        console.log(`[Polling] Updating state - Status: ${data.status}`);
        
        // Update all state
        setStatus(data.status as 'idle' | 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled');
        setProgress(data.progress);
        
        if (data.content) {
          setStoryData(data.content);
        }

        if (data.error) {
          setError(data.error);
        }

        // Stop polling if story is complete or failed
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          console.log(`[Polling] Story ${data.status}, stopping polling`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setIsPolling(false);
          }
        }

      } catch (error) {
        console.error(`[Polling] Error fetching status:`, error);
        setError(error instanceof Error ? error.message : 'Failed to fetch status');
      }
    };
    
    // Start polling every 5 seconds (reduced from 15s for better responsiveness)
    const interval = setInterval(pollWithSessionId, 5000);
    pollingIntervalRef.current = interval;
    setIsPolling(true);

    console.log(`[Polling] Polling started, doing immediate poll`);
    // Do an immediate poll
    pollWithSessionId();
  }, [sessionId]);

  // Start polling when sessionId is set and status is generating
  useEffect(() => {
    if (sessionId && status === 'generating' && !isPolling) {
      console.log(`[Polling] sessionId changed to ${sessionId}, starting polling`);
      startPolling();
    } else if (!sessionId && isPolling) {
      console.log(`[Polling] sessionId cleared, stopping polling`);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
      }
    }
  }, [sessionId, status, isPolling, startPolling]);

  const pausePolling = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumePolling = useCallback(() => {
    isPausedRef.current = false;
    // Trigger immediate poll when resuming
    pollStoryStatus();
  }, [pollStoryStatus]);

  // New function to handle orchestration process
  const startOrchestrationProcess = useCallback(async (sessionId: string) => {
    console.log(`[StoryGeneration] Starting orchestration for session ${sessionId}`);
    
    try {
      // Import the orchestration service dynamically to avoid SSR issues
      const { storyOrchestrationService } = await import('@/lib/services/storyOrchestrationService');
      
      const result = await storyOrchestrationService.orchestrateStoryGeneration(
        sessionId,
        (progressState) => {
          console.log(`[StoryGeneration] Orchestration progress: Step ${progressState.currentStep + 1}/${progressState.steps.length}`);
          
          // Update progress based on orchestration state
          setProgress(prev => ({
            ...prev,
            currentStep: 'planning', // Keep it as planning during orchestration
          }));
        }
      );

      if (result.status === 'completed') {
        console.log(`[StoryGeneration] Orchestration completed successfully`);
        // Start polling to get the final story content - pass sessionId explicitly
        startPolling(sessionId);
      } else {
        console.error(`[StoryGeneration] Orchestration failed:`, result.error);
        setError(result.error || 'Orchestration failed');
        setStatus('failed');
      }

    } catch (error) {
      console.error(`[StoryGeneration] Orchestration error:`, error);
      setError(error instanceof Error ? error.message : 'Orchestration failed');
      setStatus('failed');
    }
  }, [startPolling]);

  const startGeneration = useCallback(async (prompt: PromptInput) => {
    resetState();
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/story/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start story generation');
      }

      const data = await response.json();
      
      setSessionId(data.sessionId);
      setStatus('generating');
      setProgress({
        currentPage: 0,
        totalPages: prompt.pages,
        completedPages: 0,
      });

      // Check if orchestration is required (new multi-stage approach)
      if (data.orchestrationRequired) {
        console.log(`[StoryGeneration] Orchestration required for session ${data.sessionId}`);
        console.log(`[StoryGeneration] Starting multi-stage orchestration...`);
        
        // Start the orchestration process
        await startOrchestrationProcess(data.sessionId);
      } else {
        // Legacy approach - polling will start automatically via useEffect when sessionId is set
        console.log(`[StoryGeneration] Using legacy generation approach`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start story generation');
      setStatus('failed');
    } finally {
      setIsStarting(false);
    }
  }, [resetState, startOrchestrationProcess]);

  const cancelGeneration = useCallback(async () => {
    if (!sessionId) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/story/${sessionId}/cancel`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel story generation');
      }

      setStatus('cancelled');
      
      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsPolling(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel story generation');
    } finally {
      setIsCancelling(false);
    }
  }, [sessionId]);

  return {
    // State
    sessionId,
    status,
    progress,
    error,
    storyData,
    isStarting,
    isCancelling,
    
    // Actions
    startGeneration,
    cancelGeneration,
    resetState,
    
    // Polling control
    pausePolling,
    resumePolling,
    isPolling,
  };
}

// Optional: Hook for fetching specific page updates
export function usePageUpdates(sessionId: string | null) {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [lastFetch, setLastFetch] = useState<string>('');

  const fetchPageUpdates = useCallback(async () => {
    if (!sessionId) return;

    try {
      const url = new URL(`/api/story/${sessionId}/pages`, window.location.origin);
      if (lastFetch) {
        url.searchParams.set('since', lastFetch);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch page updates');
      }

      const data = await response.json();
      
      if (data.pages.length > 0) {
        setPages(prev => {
          const updated = [...prev];
          
          data.pages.forEach((newPage: PageContent) => {
            const existingIndex = updated.findIndex(p => p.pageIndex === newPage.pageIndex);
            if (existingIndex >= 0) {
              updated[existingIndex] = newPage;
            } else {
              updated.push(newPage);
            }
          });
          
          return updated.sort((a, b) => a.pageIndex - b.pageIndex);
        });
        
        setLastFetch(data.timestamp);
      }

    } catch (error) {
      console.error('Error fetching page updates:', error);
    }
  }, [sessionId, lastFetch]);

  useEffect(() => {
    if (!sessionId) {
      setPages([]);
      setLastFetch('');
      return;
    }

    // Initial fetch
    fetchPageUpdates();

    // Set up interval for page-specific updates (optional, more granular)
    const interval = setInterval(fetchPageUpdates, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [sessionId, fetchPageUpdates]);

  return { pages, fetchPageUpdates };
}