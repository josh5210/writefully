// /src/app/components/StoryReader.tsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface StoryPage {
    pageNumber: number;
    content: string;
    length: number;
    completedAt: string;
}

interface StoryReaderProps {
    pages: StoryPage[];
    totalPages: number;
    status: 'idle' | 'generating' | 'completed' | 'failed' | 'cancelled';
}

export default function StoryReader({ pages, totalPages, status }: StoryReaderProps) {
    const [selectedPage, setSelectedPage] = useState<number>(1);

    if (pages.length === 0 && status === 'idle') {
        return null;
    }

    const currentPage = pages.find(p => p.pageNumber === selectedPage);
    const hasPages = pages.length > 0;

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    // Navigation helpers for mobile
    const goToPreviousPage = () => {
        if (selectedPage > 1) {
            const prevPage = selectedPage - 1;
            const prevPageExists = pages.find(p => p.pageNumber === prevPage);
            if (prevPageExists) {
                setSelectedPage(prevPage);
            }
        }
    };

    const goToNextPage = () => {
        if (selectedPage < totalPages) {
            const nextPage = selectedPage + 1;
            const nextPageExists = pages.find(p => p.pageNumber === nextPage);
            if (nextPageExists) {
                setSelectedPage(nextPage);
            }
        }
    };

    const canGoPrevious = selectedPage > 1 && pages.find(p => p.pageNumber === selectedPage - 1);
    const canGoNext = selectedPage < totalPages && pages.find(p => p.pageNumber === selectedPage + 1);

    return (
        <div className="w-full mx-auto bg-[var(--card)] rounded-lg shadow-lg texture-overlay border border-[var(--border)] transition-all duration-300">
            {/* Header - Always visible */}
            <div className="p-4 sm:p-6 border-b border-[var(--border)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-xl font-serif font-semibold text-[var(--card-foreground)]">
                        Story Reader
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {hasPages && (
                            <div className="text-sm text-[var(--muted)] font-serif">
                                {pages.length} of {totalPages} pages available
                            </div>
                        )}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-[var(--muted)]/60 font-mono">
                                Selected: {selectedPage} | Available: [{pages.map(p => p.pageNumber).join(', ')}]
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!hasPages ? (
                <div className="text-center py-12 px-4">
                    <div className="text-[var(--muted)] mb-3 text-lg font-serif">
                        {status === 'generating' 
                            ? '📖 Pages will appear here as they are completed...'
                            : '📚 No story pages available yet'
                        }
                    </div>
                    {status === 'generating' && (
                        <div className="text-sm text-[var(--muted)]/70 font-serif italic">
                            The first page typically takes 1-2 minutes to generate
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row lg:gap-6">
                    {/* Mobile-First Page Navigation */}
                    <div className="lg:w-64 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border)]">
                        {/* Mobile Navigation Header */}
                        <div className="p-4 lg:p-6">
                            <h4 className="font-medium text-[var(--card-foreground)] mb-3 font-serif">Pages</h4>
                            
                            {/* Horizontal scrolling navigation for mobile */}
                            <div className="lg:hidden">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pageNum = i + 1;
                                        const page = pages.find(p => p.pageNumber === pageNum);
                                        const isCompleted = !!page;
                                        const isSelected = selectedPage === pageNum;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setSelectedPage(pageNum)}
                                                disabled={!isCompleted}
                                                className={`flex-shrink-0 px-4 py-3 rounded-lg transition-all duration-200 font-serif min-w-[80px] text-center
                                                    ${isSelected 
                                                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md' 
                                                        : isCompleted 
                                                            ? 'bg-[var(--secondary)]/20 text-[var(--card-foreground)] hover:bg-[var(--secondary)]/30' 
                                                            : 'bg-[var(--muted)]/10 text-[var(--muted)] cursor-not-allowed'
                                                    }
                                                    ${isCompleted && !isSelected ? 'hover:shadow-md' : ''}
                                                `}
                                            >
                                                <div className="font-medium text-sm">Page {pageNum}</div>
                                                <div className="text-xs mt-1">
                                                    {isCompleted ? '✓' : status === 'generating' ? '⏳' : '○'}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Desktop vertical navigation */}
                            <div className="hidden lg:block space-y-2 max-h-96 overflow-y-auto">
                                {Array.from({ length: totalPages }, (_, i) => {
                                    const pageNum = i + 1;
                                    const page = pages.find(p => p.pageNumber === pageNum);
                                    const isCompleted = !!page;
                                    const isSelected = selectedPage === pageNum;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setSelectedPage(pageNum)}
                                            disabled={!isCompleted}
                                            className={`w-full text-left px-3 py-3 rounded-md transition-all duration-200 font-serif
                                                ${isSelected 
                                                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' 
                                                    : isCompleted 
                                                        ? 'bg-[var(--secondary)]/20 text-[var(--card-foreground)] hover:bg-[var(--secondary)]/30' 
                                                        : 'bg-[var(--muted)]/10 text-[var(--muted)] cursor-not-allowed'
                                                }
                                                ${isCompleted && !isSelected ? 'hover:shadow-sm' : ''}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Page {pageNum}</span>
                                                <span className="text-xs">
                                                    {isCompleted ? '✓' : status === 'generating' ? '⏳' : '○'}
                                                </span>
                                            </div>
                                            {isCompleted && page && (
                                                <div className="text-xs opacity-70 mt-1">
                                                    ~{Math.round(page.length / 5)} words
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="flex-1 min-w-0">
                        {currentPage ? (
                            <div className="animate-fade-in">
                                {/* Mobile Navigation Controls */}
                                <div className="lg:hidden p-4 border-b border-[var(--border)] bg-[var(--background)]/50">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={goToPreviousPage}
                                            disabled={!canGoPrevious}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-serif transition-all duration-200
                                                ${canGoPrevious 
                                                    ? 'bg-[var(--secondary)]/20 text-[var(--card-foreground)] hover:bg-[var(--secondary)]/30 active:scale-95' 
                                                    : 'bg-[var(--muted)]/10 text-[var(--muted)] cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            <span className="text-lg">←</span>
                                            <span className="text-sm">Previous</span>
                                        </button>
                                        
                                        <div className="text-center">
                                            <div className="font-medium text-[var(--card-foreground)] font-serif">
                                                Page {currentPage.pageNumber}
                                            </div>
                                            <div className="text-xs text-[var(--muted)]">
                                                of {totalPages}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={goToNextPage}
                                            disabled={!canGoNext}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-serif transition-all duration-200
                                                ${canGoNext 
                                                    ? 'bg-[var(--secondary)]/20 text-[var(--card-foreground)] hover:bg-[var(--secondary)]/30 active:scale-95' 
                                                    : 'bg-[var(--muted)]/10 text-[var(--muted)] cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            <span className="text-sm">Next</span>
                                            <span className="text-lg">→</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Desktop Header */}
                                <div className="hidden lg:flex items-center justify-between p-6 pb-3 border-b border-[var(--border)]">
                                    <h4 className="text-lg font-medium text-[var(--card-foreground)] font-serif">
                                        Page {currentPage.pageNumber}
                                    </h4>
                                    <div className="text-sm text-[var(--muted)] font-serif">
                                        {currentPage.length} characters • Completed at {formatTimestamp(currentPage.completedAt)}
                                    </div>
                                </div>

                                {/* Story Content */}
                                <div className="p-4 sm:p-6 lg:pt-3">
                                    <div className="prose max-w-none">
                                        <div className="bg-[var(--background)] p-4 sm:p-6 rounded-md border border-[var(--border)]/50 
                                                      leading-relaxed text-[var(--foreground)] whitespace-pre-wrap font-serif
                                                      shadow-sm page-turn-effect text-base sm:text-lg leading-7 sm:leading-8">
                                            <ReactMarkdown>
                                                {currentPage.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Page Info */}
                                    <div className="lg:hidden mt-4 p-3 bg-[var(--secondary)]/10 rounded-lg">
                                        <div className="text-sm text-[var(--muted)] font-serif text-center">
                                            {currentPage.length} characters • ~{Math.round(currentPage.length / 5)} words
                                            <br />
                                            <span className="text-xs opacity-70">
                                                Completed at {formatTimestamp(currentPage.completedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4">
                                <div className="text-[var(--muted)] mb-2 text-lg font-serif">
                                    📄 Select a completed page to read
                                </div>
                                <div className="text-sm text-[var(--muted)]/70 font-serif italic">
                                    Page {selectedPage} is not ready yet
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Story Statistics */}
            {hasPages && (
                <div className="p-4 sm:p-6 pt-4 border-t border-[var(--border)]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-0 text-sm text-[var(--muted)] font-serif">
                        <div className="text-center sm:text-left">
                            Total words: <span className="text-[var(--card-foreground)] font-medium">
                                ~{Math.round(pages.reduce((sum, page) => sum + page.length, 0) / 5)}
                            </span>
                        </div>
                        <div className="text-center">
                            Pages completed: <span className="text-[var(--card-foreground)] font-medium">
                                {pages.length} / {totalPages}
                            </span>
                        </div>
                        <div className="text-center sm:text-right">
                            Status: <span className="capitalize text-[var(--card-foreground)] font-medium">
                                {status}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}