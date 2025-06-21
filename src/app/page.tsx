// /src/app/page.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { useStoryGenerationPolling } from '@/hooks/useStoryGenerationPolling';
import StoryForm from '@/app/components/StoryForm';
import ProgressDisplay from '@/app/components/ProgressDisplay';
import StoryReader from '@/app/components/StoryReader';
import StoryDownloader from './components/StoryDownloader';

export default function Home() {
    const {
        status,
        progress,
        error,
        storyData,
        isStarting,
        isCancelling,
        startGeneration,
        cancelGeneration,
        resetState,
    } = useStoryGenerationPolling();

    // State to control form visibility and store original prompt data
    const [showForm, setShowForm] = useState(true);
    const [currentPrompt, setCurrentPrompt] = useState<{
        topic: string;
        pages: number;
        authorStyle?: string;
        quality: 0 | 1 | 2;
    } | null>(null);
    
    // Enhanced start generation that hides the form
    const handleStartGeneration = useCallback(async (prompt: {
        topic: string;
        pages: number;
        authorStyle?: string;
        quality: 0 | 1 | 2;
    }) => {
        setCurrentPrompt(prompt);
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

    // Convert storyData.pages to the format expected by StoryReader
    const formattedPages = storyData.pages.map(page => ({
        pageNumber: page.pageIndex + 1, // Convert 0-based index to 1-based page number
        content: page.content,
        length: page.contentLength,
        completedAt: page.completedAt || new Date().toISOString(),
    }));

    // Map the polling status to component-compatible status
    const componentStatus = status === 'pending' ? 'generating' : status;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--background)]/95 
                        relative overflow-hidden">
            {/* Subtle background pattern */}
            {/* <div className="absolute inset-0 opacity-5 bg-[url('/textures/paper.png')] pointer-events-none"></div> */}
            
            <div className="relative z-10 container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-4 
                                   font-serif tracking-tight">
                        Writefully
                    </h1>
                    <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto font-serif italic">
                        Craft beautiful stories with the power of AI. Every tale, uniquely yours.
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-[var(--destructive)]/10 
                                  border border-[var(--destructive)]/20 rounded-lg">
                        <div className="text-[var(--destructive)] font-medium font-serif">
                            ⚠️ Generation Error
                        </div>
                        <div className="text-[var(--destructive)]/80 text-sm mt-1 font-serif">
                            {error}
                        </div>
                    </div>
                )}

                {/* Story Form */}
                {showForm && (
                    <div className="animate-fade-in">
                        <StoryForm 
                            onSubmit={handleStartGeneration}
                            isLoading={isStarting}
                            disabled={componentStatus === 'generating'}
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
                {!showForm && (componentStatus === 'generating' || formattedPages.length > 0) && (
                    <div className="mt-8 animate-fade-in">
                        <ProgressDisplay
                            status={componentStatus}
                            progress={progress}
                            isConnected={true} // Database polling doesn't need connection status
                            connectionError={null}
                            onCancel={cancelGeneration}
                            isCancelling={isCancelling}
                        />
                    </div>
                )}

                {/* Story Download Component - Show when story is completed */}
                {status === 'completed' && currentPrompt && formattedPages.length > 0 && (
                    <StoryDownloader
                        pages={formattedPages}
                        storyTopic={currentPrompt.topic}
                        totalPages={currentPrompt.pages}
                        authorStyle={currentPrompt.authorStyle}
                    />
                )}

                {/* Story Reader */}
                {!showForm && (
                    <div className="mt-8 animate-fade-in">
                        <StoryReader
                            pages={formattedPages}
                            totalPages={progress.totalPages}
                            status={componentStatus}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
