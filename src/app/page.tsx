// /src/app/page.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { useStoryGeneration } from '@/hooks/useStoryGeneration';
import StoryForm from '@/app/components/StoryForm';
import ProgressDisplay from '@/app/components/ProgressDisplay';
import StoryReader from '@/app/components/StoryReader';

export default function Home() {
    const {
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
        resetState,
        isStarting,
        isCancelling,
    } = useStoryGeneration();

    // State to control form visibility
    const [showForm, setShowForm] = useState(true);

    // Enhanced start generation that hides the form
    const handleStartGeneration = useCallback(async (prompt: {
        topic: string;
        pages: number;
        authorStyle?: string;
        quality: 0 | 1 | 2;
    }) => {
        setShowForm(false);
        await startGeneration(prompt);
    }, [startGeneration]);

    // Reset everything for a new story
    const handleCreateNewStory = useCallback(() => {
        // Reset all state from previous story
        resetState();

        // Show the form again
        setShowForm(true);
    }, [resetState]);

    // Show "Create New Story" button when story is completed or cancelled
    const shouldShowNewStoryButton = !showForm && (status === 'completed' || status === 'cancelled' || status === 'failed');

    return (
        <div className="min-h-[calc(100vh-16rem)]">
            {/* Error Display */}
            {error && (
                <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
                    <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg p-4 texture-overlay">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-[var(--destructive)]">⚠️</span>
                                    <span className="font-serif font-medium text-[var(--destructive)]">
                                        Something went wrong
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--foreground)]/80 font-serif">
                                    {error}
                                </p>
                            </div>
                            <button
                                onClick={clearError}
                                className="ml-4 text-[var(--destructive)] hover:text-[var(--destructive)]/80 
                                         transition-colors text-xl leading-none"
                                aria-label="Dismiss error"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story Generation Form - Only show when showForm is true */}
            {showForm && (
                <div className="animate-fade-in">
                    <StoryForm 
                        onSubmit={handleStartGeneration}
                        isLoading={isStarting}
                        disabled={status === 'generating'}
                    />
                </div>
            )}

            {/* Create New Story Button */}
            {shouldShowNewStoryButton && (
                <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
                    <button
                        onClick={handleCreateNewStory}
                        className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] 
                                 py-3 px-4 rounded-md hover:bg-[var(--primary)]/90 
                                 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] 
                                 focus:ring-offset-2 transition-all duration-300 
                                 font-serif font-medium page-turn-effect relative overflow-hidden"
                    >
                        Create New Story
                    </button>
                </div>
            )}

            {/* Progress Display */}
            {!showForm && (status === 'generating' || pages.length > 0) && (
                <div className="mt-8 animate-fade-in">
                    <ProgressDisplay
                        status={status}
                        progress={progress}
                        isConnected={isConnected}
                        connectionError={connectionError}
                        onCancel={cancelGeneration}
                        isCancelling={isCancelling}
                    />
                </div>
            )}

            {/* Story Reader */}
            {pages.length > 0 && (
                <div className="mt-8 animate-fade-in">
                    <StoryReader
                        pages={pages}
                        totalPages={progress.totalPages}
                        status={status}
                    />
                </div>
            )}

            {/* Connection Error Banner */}
            {connectionError && !error && (
                <div className="fixed bottom-4 right-4 max-w-sm animate-slide-up">
                    <div className="bg-[var(--destructive)]/10 backdrop-blur-sm 
                                  border border-[var(--destructive)]/20 rounded-lg p-4 shadow-lg">
                        <div className="flex items-center space-x-2">
                            <span className="text-[var(--destructive)]">⚠️</span>
                            <span className="text-sm font-serif text-[var(--foreground)]">
                                {connectionError}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="max-w-2xl mx-auto mt-12 mb-8">
                    <details className="group">
                        <summary className="cursor-pointer list-none p-4 bg-[var(--card)] border border-[var(--border)] 
                                         rounded-lg hover:bg-[var(--secondary)]/10 transition-colors">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-mono text-[var(--muted)]">Debug Info</h3>
                                <span className="text-[var(--muted)] group-open:rotate-180 transition-transform">
                                    ▼
                                </span>
                            </div>
                        </summary>
                        <div className="mt-2 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg 
                                      text-xs font-mono text-[var(--muted)] space-y-1">
                            <div>Session ID: {sessionId || 'None'}</div>
                            <div>Status: <span className="text-[var(--foreground)]">{status}</span></div>
                            <div>Connected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                                {isConnected ? 'Yes' : 'No'}
                            </span></div>
                            <div>Pages: {pages.length}/{progress.totalPages}</div>
                            <div>Pages in state: [{pages.map(p => p.pageNumber).join(', ')}]</div>
                            <div>Completed pages: {progress.completedPages}</div>
                            {connectionError && (
                                <div className="text-[var(--destructive)] mt-2 pt-2 border-t border-[var(--border)]">
                                    Connection Error: {connectionError}
                                </div>
                            )}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
