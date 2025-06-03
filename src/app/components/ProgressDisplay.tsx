// /src/app/components/ProgressDisplay.tsx

import React from 'react';

interface SessionProgress {
    currentPage: number;
    totalPages: number;
    completedPages: number;
    currentStep?: 'planning' | 'writing' | 'critiquing' | 'editing';
}

interface ProgressDisplayProps {
    status: 'idle' | 'generating' | 'completed' | 'failed' | 'cancelled';
    progress: SessionProgress;
    isConnected: boolean;
    connectionError: string | null;
    onCancel?: () => void;
    isCancelling?: boolean;
}

export default function ProgressDisplay({ 
    status, 
    progress, 
    isConnected, 
    connectionError, 
    onCancel, 
    isCancelling = false 
}: ProgressDisplayProps) {
    if (status === 'idle') {
        return null;
    }

    const getStatusColor = () => {
        switch (status) {
            case 'generating': return 'text-blue-600';
            case 'completed': return 'text-green-600';
            case 'failed': return 'text-red-600';
            case 'cancelled': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'generating': return (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            );
            case 'completed': return (
                <div className="text-green-600 text-xl">✓</div>
            );
            case 'failed': return (
                <div className="text-red-600 text-xl">✗</div>
            );
            case 'cancelled': return (
                <div className="text-gray-600 text-xl">⊘</div>
            );
            default: return null;
        }
    };

    const getStepDescription = () => {
        if (status === 'completed') return 'Story generation completed!';
        if (status === 'failed') return 'Story generation failed';
        if (status === 'cancelled') return 'Story generation cancelled';
        
        if (!progress.currentStep) return 'Preparing...';
        
        const stepDescriptions = {
            planning: 'Planning the story structure...',
            writing: 'Writing content...',
            critiquing: 'Analyzing and critiquing...',
            editing: 'Refining and improving...'
        };
        
        return stepDescriptions[progress.currentStep] || 'Processing...';
    };

    const progressPercentage = progress.totalPages > 0 
        ? Math.round((progress.completedPages / progress.totalPages) * 100)
        : 0;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Story Generation Progress</h3>
                {status === 'generating' && onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center mb-4 text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                {connectionError && (
                    <span className="ml-2 text-red-500 text-xs">({connectionError})</span>
                )}
            </div>

            {/* Status */}
            <div className="flex items-center mb-4">
                <div className="mr-3">{getStatusIcon()}</div>
                <div>
                    <div className={`font-medium ${getStatusColor()}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                        {getStepDescription()}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {progress.totalPages > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Pages completed: {progress.completedPages} / {progress.totalPages}</span>
                        <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Current Page Details */}
            {status === 'generating' && progress.currentPage > 0 && (
                <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-700">
                        <div className="font-medium">Currently working on:</div>
                        <div>Page {progress.currentPage} of {progress.totalPages}</div>
                        {progress.currentStep && (
                            <div className="text-gray-500 capitalize">
                                Step: {progress.currentStep}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Completion Message */}
            {status === 'completed' && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="text-green-800 font-medium">
                        🎉 Your story has been completed!
                    </div>
                    <div className="text-green-700 text-sm mt-1">
                        All {progress.totalPages} pages have been generated and are ready to read.
                    </div>
                </div>
            )}

            {/* Error State */}
            {status === 'failed' && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                    <div className="text-red-800 font-medium">
                        Generation failed
                    </div>
                    <div className="text-red-700 text-sm mt-1">
                        Please try again or contact support if the problem persists.
                    </div>
                </div>
            )}
        </div>
    );
}