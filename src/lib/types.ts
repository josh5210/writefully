// /src/lib/types.ts

/**
 * User-supplied options
 */
export interface PromptInput {
    topic: string;
    pages: number;
    authorStyle?: string;
    quality: 0 | 1 | 2;     // draft rewrites/edits
}


/**
 * What the planner returns
 */
export interface PagePlan {
    page: number;   // 1-based
    summary: string;    // 1-sentence "beat"
}

export interface StoryPlan {
    title: string;
    outline: PagePlan[];
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
