// /src/app/components/StoryReader.tsx

import React, { useState } from 'react';

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

    return (
        <div className="max-w-4xl mx-auto p-6 bg-[var(--card)] rounded-lg shadow-lg texture-overlay border border-[var(--border)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif font-semibold text-[var(--card-foreground)]">
                    Story Reader
                </h3>
                <div className="flex items-center space-x-4">
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

            {!hasPages ? (
                <div className="text-center py-12">
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
                <div className="flex gap-6">
                    {/* Page Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <h4 className="font-medium text-[var(--card-foreground)] mb-3 font-serif">Pages</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
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
                                        className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 font-serif
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

                    {/* Page Content */}
                    <div className="flex-1 min-w-0">
                        {currentPage ? (
                            <div className="animate-fade-in">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                                    <h4 className="text-lg font-medium text-[var(--card-foreground)] font-serif">
                                        Page {currentPage.pageNumber}
                                    </h4>
                                    <div className="text-sm text-[var(--muted)] font-serif">
                                        {currentPage.length} characters • Completed at {formatTimestamp(currentPage.completedAt)}
                                    </div>
                                </div>
                                <div className="prose max-w-none">
                                    <div className="bg-[var(--background)] p-6 rounded-md border border-[var(--border)]/50 
                                                  leading-relaxed text-[var(--foreground)] whitespace-pre-wrap font-serif
                                                  shadow-sm page-turn-effect">
                                        {currentPage.content}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
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
                <div className="mt-6 pt-4 border-t border-[var(--border)]">
                    <div className="flex justify-between text-sm text-[var(--muted)] font-serif">
                        <div>
                            Total words: <span className="text-[var(--card-foreground)] font-medium">
                                ~{Math.round(pages.reduce((sum, page) => sum + page.length, 0) / 5)}
                            </span>
                        </div>
                        <div>
                            Pages completed: <span className="text-[var(--card-foreground)] font-medium">
                                {pages.length} / {totalPages}
                            </span>
                        </div>
                        <div>
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