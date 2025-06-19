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
        <div className="max-w-2xl mx-auto p-6 bg-[var(--card)] rounded-lg shadow-lg texture-overlay transition-all duration-300">
            <h2 className="text-2xl font-serif font-bold mb-6 text-[var(--card-foreground)]">
                Craft Your Story
            </h2>
            
            <div className="space-y-6">
                {/* Topic Input */}
                <div>
                    <label className="block text-sm font-medium text-[var(--card-foreground)] mb-2">
                        What shall we write about? *
                    </label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="A tale of adventure, mystery, or wonder..."
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-md 
                                 bg-[var(--input)] text-[var(--foreground)]
                                 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent 
                                 resize-none transition-all duration-200 font-serif"
                        rows={3}
                        maxLength={500}
                        disabled={disabled}
                    />
                    <p className="text-xs text-[var(--muted)] mt-1 font-serif italic">
                        {topic.length}/500 characters
                    </p>
                </div>

                {/* Pages Input */}
                <div>
                    <label className="block text-sm font-medium text-[var(--card-foreground)] mb-2">
                        Length of your tale
                    </label>
                    <input
                        type="number"
                        value={pages}
                        onChange={(e) => setPages(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        min="1"
                        max="50"
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-md 
                                 bg-[var(--input)] text-[var(--foreground)]
                                 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
                                 transition-all duration-200"
                        disabled={disabled}
                    />
                    <p className="text-xs text-[var(--muted)] mt-1 font-serif italic">
                        Each page unfolds approximately 300-400 words
                    </p>
                </div>

                {/* Author Style Input */}
                <div>
                    <label className="block text-sm font-medium text-[var(--card-foreground)] mb-2">
                        In the style of... (Optional)
                    </label>
                    <input
                        type="text"
                        value={authorStyle}
                        onChange={(e) => setAuthorStyle(e.target.value)}
                        placeholder="Hemingway, Austen, Tolkien..."
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-md 
                                 bg-[var(--input)] text-[var(--foreground)]
                                 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
                                 transition-all duration-200"
                        disabled={disabled}
                    />
                    <p className="text-xs text-[var(--muted)] mt-1 font-serif italic">
                        Leave blank for an original voice
                    </p>
                </div>

                {/* Quality Selection */}
                <div>
                    <label className="block text-sm font-medium text-[var(--card-foreground)] mb-3">
                        Craft Quality
                    </label>
                    <div className="space-y-3">
                        {[0, 1, 2].map((level) => (
                            <div 
                                key={level} 
                                className="flex items-center cursor-pointer p-3 rounded-md
                                         hover:bg-[var(--secondary)]/10 transition-colors duration-200" 
                                onClick={() => setQuality(level as 0 | 1 | 2)}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 transition-all duration-200 ${
                                    quality === level 
                                        ? 'bg-[var(--primary)] border-[var(--primary)]' 
                                        : 'border-[var(--border)]'
                                }`}>
                                    {quality === level && (
                                        <div className="w-2 h-2 bg-[var(--primary-foreground)] rounded-full m-0.5"></div>
                                    )}
                                </div>
                                <span className="text-sm text-[var(--card-foreground)] font-serif">
                                    {qualityLabels[level as keyof typeof qualityLabels]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-2 font-serif italic">
                        Higher quality involves more rounds of refinement
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!topic.trim() || disabled || isLoading}
                    className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] 
                             py-3 px-4 rounded-md hover:bg-[var(--primary)]/90 
                             focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 
                             disabled:opacity-50 disabled:cursor-not-allowed 
                             transition-all duration-300 font-serif font-medium
                             page-turn-effect relative overflow-hidden"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[var(--primary-foreground)] 
                                          border-t-transparent rounded-full mr-2 generating-pulse"></div>
                            Crafting your story...
                        </div>
                    ) : (
                        'Begin Writing'
                    )}
                </button>
            </div>
        </div>
    );
}