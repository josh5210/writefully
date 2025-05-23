// /src/lib/types.ts

/**
 * User-supplied options
 */
export interface PromptInput {
    topic: string;
    pages: number;
    authorStyle?: string;
    quality: 0 | 1 | 2;     // draft rewrites/edits
    artStyle?: string;
    readerVoice?: string;
}


// Writing Content with metadata
export interface Content {
    text: string;
    metadata: ContentMetadata;
}


export interface ContentMetadata {
    prompt: PromptInput;
    iteration: number;
    timestamp: Date;
    modelInfo: {
        name: string;
        version?: string;
        provider?: string;
    };
    pageNumber?: number;
}


// Context provided to modules of the content in previous pages
export interface PageContext {
    storyPlan: string;          // Output of storyPlanner (string)
    currentPageIndex: number;   // Current page being processed (0-based)
    currentPagePlan: string;    // Output of pagePlanner (string)
    recentPreviousPagesFull: Content[];   // Content of most recent (up to) 2 pages in full
}


/**
 * Config for LLM Api Calls
 */
export interface LlmApiConfig {
    apiKey: string;
    modelName: string;
    baseUrl: string;
    maxRetries: number;
    timeout: number;
    provider?: string;  // 'openrouter', etc.
    refererUrl?: string;    // for openrouter http-referer header
    appName?: string;   // for openrouter x-title header
}


/** 
 * Response from the LLM API
 * usage may not be included: https://openrouter.ai/docs/api-reference/overview
 */
export interface LlmResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}


/**
 * Chat types from LLM (text or image chunks)
 */
export type ChatTextChunk = { type: 'text'; text: string };
export type ChatImageChunk = { type: 'image_url'; image_url: { url: string } };
export type ChatChunk = ChatTextChunk | ChatImageChunk;

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string | ChatChunk[];
}


/**
 * Session management types
 */
export interface StorySession {
    sessionId: string;
    storyId: string;
    status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
    prompt: PromptInput;
    createdAt: Date;
    updatedAt: Date;
    progress: SessionProgress;
    error?: string;
}

export interface SessionProgress {
    currentPage: number;
    totalPages: number;
    completedPages: number;
    currentStep?: 'planning' | 'writing' | 'critiquing' | 'editing';
    estimatedTimeRemaining?: number;    // seconds
}


/**
 * API Request/Response types
 */
export interface StartStoryRequest {
    request: PromptInput;
}

export interface StartStoryResponse {
    sessionId: string;
    storyId: string;
    status: string;
    message: string;
    progress: SessionProgress;
}

export interface GetStatusReponse {
    sessionId: string;
    storyId: string;
    status: string;
    progress: SessionProgress;
    prompt: PromptInput;
    createdAt: Date;
    error?: string;
}

export interface CancelStoryResponse {
    sessionId: string;
    status: string;
    message: string;
}

export interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version?: string;
    environment: string;
    services: {
        api: 'healthy' | 'unhealthy';
        database?: 'healthy' | 'unhealthy';
        orchestrator?: 'healthy' | 'unhealthy';
    };
}
