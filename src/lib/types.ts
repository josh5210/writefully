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
    expiresAt: Date;
}

export interface SessionProgress {
    currentPage: number;
    totalPages: number;
    completedPages: number;
    currentStep?: 'planning' | 'writing' | 'critiquing' | 'editing';
    estimatedTimeRemaining?: number;    // seconds
}

export interface CreateSessionOptions {
    prompt: PromptInput;
    sessionId?: string;     // Optional override for testing
    storyId?: string;       // Optional override for testing
}

export interface UpdateSessionOptions {
    status?: StorySession['status'];
    progress?: Partial<SessionProgress>;
    error?: string;
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


/**
 * Event Types
 */
// Base event types
interface BaseStreamEvent {
    sessionId: string;
    timestamp: string;
    message?: string;
}

// Specific event types with their data structures
export interface ConnectionEvent extends BaseStreamEvent {
    type: 'connection';
    data: {
        message: string;
    };
}

export interface HeartbeatEvent extends BaseStreamEvent {
    type: 'heartbeat';
    data: {
        message: string;
    };
}

export interface SessionStateEvent extends BaseStreamEvent {
    type: 'session_state';
    data: {
        status: string;
        progress: {
            currentPage: number;
            totalPages: number;
            completedPages: number;
            currentStep?: 'planning' | 'writing' | 'critiquing' | 'editing';
        };
        error?: string;
    };
}

export interface StoryStartedEvent extends BaseStreamEvent {
    type: 'story_started';
    data: {
        totalPages: number;
        status: string;
    };
}

export interface StoryPlanCreatedEvent extends BaseStreamEvent {
    type: 'story_plan_created';
    data: {
        planLength: number;
        currentStep: string;
    };
}

export interface PagePlanCreatedEvent extends BaseStreamEvent {
    type: 'page_plan_created';
    data: {
        pageIndex: number;
        pageNumber: number;
        currentStep: string;
    };
}

export interface PageContentCreatedEvent extends BaseStreamEvent {
    type: 'page_content_created';
    data: {
        pageIndex: number;
        pageNumber: number;
        contentLength: number;
        currentStep: string;
    };
}

export interface PageCritiqueCreatedEvent extends BaseStreamEvent {
    type: 'page_critique_created';
    data: {
        pageIndex: number;
        pageNumber: number;
        critiqueLength: number;
        currentStep: string;
    };
}

export interface PageEditedEvent extends BaseStreamEvent {
    type: 'page_edited';
    data: {
        pageIndex: number;
        pageNumber: number;
        contentLength: number;
        iteration: number;
        currentStep: string;
    };
}

export interface PageCompletedEvent extends BaseStreamEvent {
    type: 'page_completed';
    data: {
        pageIndex: number;
        pageNumber: number;
        content: string;
        contentLength: number;
        completedPages: number;
        totalPages: number;
        isStoryComplete: boolean;
        currentStep?: string;
    };
}

export interface StoryCompletedEvent extends BaseStreamEvent {
    type: 'story_completed';
    data: {
        totalPages: number;
        status: string;
        pages: Array<{
            text: string;
            length: number;
            iteration: number;
            timestamp: string;
        }>;
    };
}

export interface ErrorEvent extends BaseStreamEvent {
    type: 'error';
    data: {
        error: string;
        status: string;
    };
}

// Union type of all possible events
export type StreamEvent = 
    | ConnectionEvent
    | HeartbeatEvent
    | SessionStateEvent
    | StoryStartedEvent
    | StoryPlanCreatedEvent
    | PagePlanCreatedEvent
    | PageContentCreatedEvent
    | PageCritiqueCreatedEvent
    | PageEditedEvent
    | PageCompletedEvent
    | StoryCompletedEvent
    | ErrorEvent;

// Type guard functions to narrow event types
export function isPageCompletedEvent(event: StreamEvent): event is PageCompletedEvent {
    return event.type === 'page_completed';
}

export function isStoryStartedEvent(event: StreamEvent): event is StoryStartedEvent {
    return event.type === 'story_started';
}

export function isErrorEvent(event: StreamEvent): event is ErrorEvent {
    return event.type === 'error';
}

// Generic event type for eventStreamer (when we don't know the specific type yet)
export interface GenericStreamEvent {
    type: string;
    sessionId: string;
    timestamp: string;
    data?: unknown;
    message?: string;
}