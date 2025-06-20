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
            storyPlanning: 40000,  // seconds for story planning subtasks
            pageGeneration: 45000, // seconds for page generation
            default: 30000         // seconds for other operations
        },
        provider: 'openrouter',
        refererUrl: process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
        appName: process.env.OPENROUTER_APP_NAME || 'writefully',
    };
}

export function createFastLlmConfig(): EnhancedLlmApiConfig {
    // Validate required env vars
    const apiKey = process.env.OPENROUTER_API_KEY;
    const fastModelName = process.env.FAST_MODEL_NAME;
    const backupModelName = process.env.BACKUP_MODEL_NAME;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    if (!fastModelName) {
        console.warn('FAST_MODEL_NAME not found, falling back to regular model');
        return createLlmConfig();
    }

    return {
        apiKey,
        modelName: fastModelName,
        backupModelName,
        baseUrl: 'https://openrouter.ai/api/v1',
        maxRetries: 3,
        timeout: 20000, // Shorter timeout for fast model
        timeouts: {
            storyPlanning: 25000,  // Shorter timeout for fast planning
            pageGeneration: 45000, // Keep longer for page generation
            default: 20000         // Shorter default for fast model
        },
        provider: 'openrouter',
        refererUrl: process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
        appName: process.env.OPENROUTER_APP_NAME || 'writefully',
    };
}
