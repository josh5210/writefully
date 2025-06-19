// /src/hooks/useStoryGeneration.ts

import { useState, useCallback, useEffect } from 'react';
import { useEventStream } from './useEventStream';

interface PromptInput {
    topic: string;
    pages: number;
    authorStyle?: string;
    quality: 0 | 1 | 2;
}

interface SessionProgress {
    currentPage: number;
    totalPages: number;
    completedPages: number;
    currentStep?: 'planning' | 'writing' | 'critiquing' | 'editing';
    estimatedTimeRemaining?: number;
}

interface StoryPage {
    pageNumber: number;
    content: string;
    length: number;
    completedAt: string;
}

export interface UseStoryGenerationResult {
    // Session state
    sessionId: string | null;
    status: 'idle' | 'generating' | 'completed' | 'failed' | 'cancelled';
    progress: SessionProgress;
    error: string | null;
    
    // Story content
    pages: StoryPage[];
    
    // Event stream state
    isConnected: boolean;
    connectionError: string | null;
    
    // Actions
    startGeneration: (prompt: PromptInput) => Promise<void>;
    cancelGeneration: () => Promise<void>;
    clearError: () => void;
    
    // Loading states
    isStarting: boolean;
    isCancelling: boolean;
}

export function useStoryGeneration(): UseStoryGenerationResult {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'failed' | 'cancelled'>('idle');
    const [progress, setProgress] = useState<SessionProgress>({
        currentPage: 0,
        totalPages: 0,
        completedPages: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [pages, setPages] = useState<StoryPage[]>([]);
    const [isStarting, setIsStarting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Use event stream hook
    const { isConnected, error: connectionError, lastEvent, events } = useEventStream(sessionId);

    // Debug: Log all events received
    useEffect(() => {
        console.log('[Frontend] Total events received:', events.length);
        const pageCompletedEvents = events.filter(e => e.type === 'page_completed');
        console.log('[Frontend] Page completed events received:', pageCompletedEvents.length, pageCompletedEvents.map(e => e.data?.pageNumber));
    }, [events]);

    // Process incoming events
    useEffect(() => {
        if (!lastEvent) return;

        console.log('[Frontend] Processing event:', lastEvent.type, lastEvent);
        console.log('[Frontend] Event timestamp:', lastEvent.timestamp, 'Current pages count:', pages.length);

        switch (lastEvent.type) {
            case 'story_started':
                setStatus('generating');
                setProgress(prev => ({
                    ...prev,
                    totalPages: lastEvent.data?.totalPages || prev.totalPages,
                    currentStep: 'planning'
                }));
                break;

            case 'story_plan_created':
                setProgress(prev => ({
                    ...prev,
                    currentStep: 'planning'
                }));
                break;

            case 'page_plan_created':
                setProgress(prev => ({
                    ...prev,
                    currentPage: lastEvent.data?.pageNumber || prev.currentPage,
                    currentStep: 'planning'
                }));
                break;

            case 'page_content_created':
                setProgress(prev => ({
                    ...prev,
                    currentPage: lastEvent.data?.pageNumber || prev.currentPage,
                    currentStep: 'writing'
                }));
                break;

            case 'page_critique_created':
                setProgress(prev => ({
                    ...prev,
                    currentStep: 'critiquing'
                }));
                break;

            case 'page_edited':
                setProgress(prev => ({
                    ...prev,
                    currentStep: 'editing'
                }));
                break;

            case 'page_completed':
                const pageData = lastEvent.data;

                console.log('[Frontend] Page completed event data:', pageData);

                if (pageData) {
                    // Add completed page to pages array
                    const newPage: StoryPage = {
                        pageNumber: pageData.pageNumber,
                        content: pageData.content,
                        length: pageData.contentLength,
                        completedAt: lastEvent.timestamp,
                    };

                    console.log('[Frontend] Adding new page:', newPage.pageNumber, 'Content length:', newPage.content?.length || 0);
                    console.log('[Frontend] Current pages in state before update:', pages.map(p => p.pageNumber));

                    setPages(prev => {
                        console.log('[Frontend] setPages called with prev:', prev.map(p => p.pageNumber));
                        // Replace existing page or add new one
                        const existingIndex = prev.findIndex(p => p.pageNumber === newPage.pageNumber);
                        if (existingIndex >= 0) {
                            const updated = [...prev];
                            updated[existingIndex] = newPage;
                            console.log('[Frontend] Replaced existing page. Total pages:', updated.length);
                            return updated;
                        } else {
                            const newPages = [...prev, newPage].sort((a, b) => a.pageNumber - b.pageNumber);
                            console.log('[Frontend] Added new page. Total pages:', newPages.length, 'Page numbers:', newPages.map(p => p.pageNumber));
                            return newPages;                        }
                    });

                    setProgress(prev => ({
                        ...prev,
                        completedPages: pageData.completedPages || prev.completedPages,
                        currentStep: pageData.isStoryComplete ? undefined : 'planning'
                    }));
                } else {
                    console.log('[Frontend] page_completed event had no data!');
                }
                break;

            case 'story_completed':
                console.log('[Frontend] Story completed event:', lastEvent.data);
                setStatus('completed');
                setProgress(prev => ({
                    ...prev,
                    currentStep: undefined
                }));
                break;

            case 'error':
                setStatus('failed');
                setError(lastEvent.data?.error || 'An error occurred during story generation');
                break;

            case 'session_state':
                // Handle initial session state
                if (lastEvent.data) {
                    setStatus(lastEvent.data.status);
                    setProgress(lastEvent.data.progress);
                    if (lastEvent.data.error) {
                        setError(lastEvent.data.error);
                    }
                }
                break;
        }
    }, [lastEvent]);

    const startGeneration = useCallback(async (prompt: PromptInput) => {
        setIsStarting(true);
        setError(null);
        setPages([]);
        setProgress({
            currentPage: 0,
            totalPages: prompt.pages,
            completedPages: 0,
        });

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

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start story generation');
            setStatus('failed');
        } finally {
            setIsStarting(false);
        }
    }, []);

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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel story generation');
        } finally {
            setIsCancelling(false);
        }
    }, [sessionId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        sessionId,
        status,
        progress,
        error,
        pages,
        isConnected,
        connectionError,
        startGeneration,
        cancelGeneration,
        clearError,
        isStarting,
        isCancelling,
    };
}