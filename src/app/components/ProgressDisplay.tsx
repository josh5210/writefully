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
            case 'generating': return 'text-[var(--primary)]';
            case 'completed': return 'text-emerald-600 dark:text-emerald-400';
            case 'failed': return 'text-[var(--destructive)]';
            case 'cancelled': return 'text-[var(--muted)]';
            default: return 'text-[var(--muted)]';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'generating': return (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary)]"></div>
            );
            case 'completed': return (
                <div className="text-emerald-600 dark:text-emerald-400 text-xl">✓</div>
            );
            case 'failed': return (
                <div className="text-[var(--destructive)] text-xl">✗</div>
            );
            case 'cancelled': return (
                <div className="text-[var(--muted)] text-xl">⊘</div>
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
        <div className="max-w-2xl mx-auto p-6 bg-[var(--card)] rounded-lg shadow-lg texture-overlay border border-[var(--border)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-semibold text-[var(--card-foreground)]">
                    Story Generation Progress
                </h3>
                {status === 'generating' && onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="px-4 py-2 text-[var(--destructive)] border border-[var(--destructive)]/30 rounded-md 
                                 hover:bg-[var(--destructive)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] 
                                 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
                                 transition-colors font-serif text-sm"
                    >
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center mb-4 text-sm font-serif">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-[var(--destructive)]'
                }`}></div>
                <span className={isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--destructive)]'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                {connectionError && (
                    <span className="ml-2 text-[var(--destructive)] text-xs">({connectionError})</span>
                )}
            </div>

            {/* Status */}
            <div className="flex items-center mb-4">
                <div className="mr-3">{getStatusIcon()}</div>
                <div>
                    <div className={`font-medium font-serif ${getStatusColor()}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    <div className="text-sm text-[var(--muted)] font-serif italic">
                        {getStepDescription()}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {progress.totalPages > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-[var(--muted)] mb-2 font-serif">
                        <span>Pages completed: {progress.completedPages} / {progress.totalPages}</span>
                        <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-[var(--secondary)]/30 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 h-3 rounded-full 
                                     transition-all duration-500 ease-out relative overflow-hidden"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            {/* Subtle shimmer effect for active progress */}
                            {status === 'generating' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                              animate-pulse"></div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Current Page Details */}
            {status === 'generating' && progress.currentPage > 0 && (
                <div className="bg-[var(--secondary)]/10 p-4 rounded-md border border-[var(--border)]/50">
                    <div className="text-sm text-[var(--card-foreground)] font-serif">
                        <div className="font-medium mb-1">Currently working on:</div>
                        <div className="text-[var(--muted)]">
                            Page {progress.currentPage} of {progress.totalPages}
                        </div>
                        {progress.currentStep && (
                            <div className="text-[var(--muted)] capitalize italic mt-1">
                                Step: {progress.currentStep}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Completion Message */}
            {status === 'completed' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <div className="text-emerald-800 dark:text-emerald-200 font-medium font-serif flex items-center">
                        <span className="mr-2 text-lg">🎉</span>
                        Your story has been completed!
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-300 text-sm mt-1 font-serif italic">
                        All {progress.totalPages} pages have been generated and are ready to read.
                    </div>
                </div>
            )}

            {/* Error State */}
            {status === 'failed' && (
                <div className="bg-[var(--destructive)]/10 p-4 rounded-md border border-[var(--destructive)]/20">
                    <div className="text-[var(--destructive)] font-medium font-serif flex items-center">
                        <span className="mr-2">⚠️</span>
                        Generation failed
                    </div>
                    <div className="text-[var(--destructive)]/80 text-sm mt-1 font-serif">
                        Please try again or contact support if the problem persists.
                    </div>
                </div>
            )}

            {/* Cancelled State */}
            {status === 'cancelled' && (
                <div className="bg-[var(--muted)]/10 p-4 rounded-md border border-[var(--border)]">
                    <div className="text-[var(--muted)] font-medium font-serif flex items-center">
                        <span className="mr-2">⏹️</span>
                        Generation cancelled
                    </div>
                    <div className="text-[var(--muted)]/80 text-sm mt-1 font-serif italic">
                        Your story generation was stopped. You can start a new story anytime.
                    </div>
                </div>
            )}
        </div>
    );
}