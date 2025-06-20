import { LlmApiConfig } from "../types";

export interface EnhancedLlmApiConfig extends LlmApiConfig {
    backupModelName?: string;
    timeouts: {
        storyPlanning: number;
        pageGeneration: number;
        default: number;
    };
}

export function createLlmConfig(): EnhancedLlmApiConfig {
    // Validate required env vars
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.OPENROUTER_MODEL_NAME;
    const backupModelName = process.env.BACKUP_MODEL_NAME;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    if (!modelName) {
        throw new Error('OPENROUTER_MODEL environment variable is required');
    }

    return {
        apiKey,
        modelName,
        backupModelName,
        baseUrl: 'https://openrouter.ai/api/v1',
        maxRetries: 3,
        timeout: 30000, // Default timeout for individual LLM calls
        timeouts: {
            storyPlanning: 35000,  // 35 seconds for story planning subtasks (reduced from 40s)
            pageGeneration: 40000, // 40 seconds for page generation (reduced from 45s)
            default: 25000         // 25 seconds for other operations (reduced from 30s)
        },
        provider: 'openrouter',
        refererUrl: process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
        appName: process.env.OPENROUTER_APP_NAME || 'writefully',
    };
}
