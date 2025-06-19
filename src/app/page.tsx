// /src/app/page.tsx

'use client';

import React from 'react';
import { useStoryGeneration } from '@/hooks/useStoryGeneration';
import StoryForm from '@/app/components/StoryForm'
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
        isStarting,
        isCancelling,
    } = useStoryGeneration();

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">✍️ Writefully</h1>
                    <p className="text-lg text-gray-600">AI-powered story generation with real-time progress</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex justify-between items-center">
                            <div className="text-red-800">{error}</div>
                            <button
                                onClick={clearError}
                                className="text-red-600 hover:text-red-800 ml-4"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Story Generation Form */}
                <StoryForm 
                    onSubmit={startGeneration}
                    isLoading={isStarting}
                    disabled={status === 'generating'}
                />

                {/* Progress Display */}
                <ProgressDisplay
                    status={status}
                    progress={progress}
                    isConnected={isConnected}
                    connectionError={connectionError}
                    onCancel={cancelGeneration}
                    isCancelling={isCancelling}
                />

                {/* Story Reader */}
                <StoryReader
                    pages={pages}
                    totalPages={progress.totalPages}
                    status={status}
                />

                {/* Debug Info (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="max-w-2xl mx-auto mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div>Session ID: {sessionId || 'None'}</div>
                            <div>Status: {status}</div>
                            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                            <div>Pages: {pages.length}/{progress.totalPages}</div>
                            <div>Pages in state: {pages.map(p => p.pageNumber).join(', ')}</div>
                            <div>Completed pages (progress): {progress.completedPages}</div>
                            {connectionError && <div className="text-red-600">Connection Error: {connectionError}</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}