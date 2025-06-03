// /src/app/components/StoryForm.tsx

import React, { useState } from 'react';

interface PromptInput {
    topic: string;
    pages: number;
    authorStyle?: string;
    quality: 0 | 1 | 2;
}

interface StoryFormProps {
    onSubmit: (prompt: PromptInput) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

export default function StoryForm({ onSubmit, isLoading = false, disabled = false }: StoryFormProps) {
    const [topic, setTopic] = useState('');
    const [pages, setPages] = useState(3);
    const [authorStyle, setAuthorStyle] = useState('');
    const [quality, setQuality] = useState<0 | 1 | 2>(0);

    const handleSubmit = () => {
        if (!topic.trim()) return;

        const prompt: PromptInput = {
            topic: topic.trim(),
            pages,
            quality,
            authorStyle: authorStyle.trim() || undefined,
        };

        onSubmit(prompt);
    };

    const qualityLabels = {
        0: 'Draft (Fast)',
        1: 'Good (1 revision)',
        2: 'High Quality (2 revisions)'
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Generate Your Story</h2>
            
            <div className="space-y-6">
                {/* Topic Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Story Topic *
                    </label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What should your story be about? Be as specific or general as you like..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={500}
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">{topic.length}/500 characters</p>
                </div>

                {/* Pages Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Pages
                    </label>
                    <input
                        type="number"
                        value={pages}
                        onChange={(e) => setPages(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        min="1"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">Each page is approximately 300-400 words</p>
                </div>

                {/* Author Style Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Author Style (Optional)
                    </label>
                    <input
                        type="text"
                        value={authorStyle}
                        onChange={(e) => setAuthorStyle(e.target.value)}
                        placeholder="e.g., Ernest Hemingway, J.K. Rowling, Isaac Asimov..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank for original style</p>
                </div>

                {/* Quality Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Quality Level
                    </label>
                    <div className="space-y-2">
                        {[0, 1, 2].map((level) => (
                            <div key={level} className="flex items-center cursor-pointer" onClick={() => setQuality(level as 0 | 1 | 2)}>
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${quality === level ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                    {quality === level && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                </div>
                                <span className="text-sm text-gray-700">
                                    {qualityLabels[level as keyof typeof qualityLabels]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Higher quality takes longer but produces better results through critique and editing cycles
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!topic.trim() || disabled || isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Starting Generation...
                        </div>
                    ) : (
                        'Generate Story'
                    )}
                </button>
            </div>
        </div>
    );
}