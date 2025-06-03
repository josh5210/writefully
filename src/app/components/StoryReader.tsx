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
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Story Reader</h3>
                {hasPages && (
                    <div className="text-sm text-gray-600">
                        {pages.length} of {totalPages} pages available
                    </div>
                )}
            </div>

            {!hasPages ? (
                <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">
                        {status === 'generating' 
                            ? '📖 Pages will appear here as they are completed...'
                            : '📚 No story pages available yet'
                        }
                    </div>
                    {status === 'generating' && (
                        <div className="text-sm text-gray-400">
                            The first page typically takes 1-2 minutes to generate
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex gap-6">
                    {/* Page Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <h4 className="font-medium text-gray-700 mb-3">Pages</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {Array.from({ length: totalPages }, (_, i) => {
                                const pageNum = i + 1;
                                const page = pages.find(p => p.pageNumber === pageNum);
                                const isCompleted = !!page;
                                const isSelected = selectedPage === pageNum;
                                
                                return (
                                    <div
                                        key={pageNum}
                                        onClick={() => {
                                            if (isCompleted) {
                                                setSelectedPage(pageNum);
                                            }
                                        }}
                                        className={`p-3 rounded-md border cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : isCompleted
                                                ? 'border-green-300 bg-green-50 hover:bg-green-100'
                                                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`font-medium ${
                                                isSelected 
                                                    ? 'text-blue-700'
                                                    : isCompleted 
                                                    ? 'text-green-700' 
                                                    : 'text-gray-400'
                                            }`}>
                                                Page {pageNum}
                                            </span>
                                            {isCompleted ? (
                                                <span className="text-green-600 text-sm">✓</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">⋯</span>
                                            )}
                                        </div>
                                        {isCompleted && page && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {page.length} chars • {formatTimestamp(page.completedAt)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="flex-1">
                        {currentPage ? (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-800">
                                        Page {currentPage.pageNumber}
                                    </h4>
                                    <div className="text-sm text-gray-500">
                                        {currentPage.length} characters • Completed at {formatTimestamp(currentPage.completedAt)}
                                    </div>
                                </div>
                                <div className="prose max-w-none">
                                    <div className="bg-gray-50 p-6 rounded-md border border-gray-200 leading-relaxed text-gray-800 whitespace-pre-wrap">
                                        {currentPage.content}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-500 mb-2">
                                    📄 Select a completed page to read
                                </div>
                                <div className="text-sm text-gray-400">
                                    Page {selectedPage} is not ready yet
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Story Statistics */}
            {hasPages && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                        <div>
                            Total words: ~{Math.round(pages.reduce((sum, page) => sum + page.length, 0) / 5)}
                        </div>
                        <div>
                            Pages completed: {pages.length} / {totalPages}
                        </div>
                        <div>
                            Status: <span className="capitalize">{status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}