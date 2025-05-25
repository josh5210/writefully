import { LlmApiConfig } from "../types";


export function createLlmConfig(): LlmApiConfig {
    // Validate required env vars
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.OPENROUTER_MODEL_NAME;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    if (!modelName) {
        throw new Error('OPENROUTER_MODEL environment variable is required');
    }

    return {
        apiKey,
        modelName,
        baseUrl: 'https://openrouter.ai/api/v1',
        maxRetries: 3,
        timeout: 30000,
        provider: 'openrouter',
        refererUrl: process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
        appName: process.env.OPENROUTER_APP_NAME || 'writefully',
    };
}
