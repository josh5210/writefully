// /src/lib/llm/llmApiInterfaces.ts

import { LlmApiConfig } from "../types";
import { EnhancedLlmApiConfig } from "./config";
import { BaseLlmClient } from "./baseClient";
import { OpenRouterClient } from "./openRouterClient";


/**
 * Factory function to create the llm API client
 * @param configOverride optional config override
 * @returns Instance of the LLM client
 */
export function createLlmClient(configOverride?: Partial<LlmApiConfig> | Partial<EnhancedLlmApiConfig>): BaseLlmClient {
    // Default config for llm
    const defaultConfig: EnhancedLlmApiConfig = {
        apiKey: '',
        modelName: '',
        backupModelName: undefined,
        baseUrl: 'https://openrouter.ai/api/v1',
        maxRetries: 3,
        timeout: 30000,
        timeouts: {
            storyPlanning: 40000,
            pageGeneration: 45000,
            default: 30000
        },
        provider: 'openrouter',
    };

    // Merge with overrides
    const config = { ...defaultConfig, ...configOverride };

    // Validate the required fields
    if (!config.apiKey) {
        throw new Error('apiKey is missing!');
    }

    if (!config.modelName) {
        throw new Error('modelName is missing!');
    }

    // Log configuration status
    console.log(`[LLM] Creating client with primary model: ${config.modelName}${config.backupModelName ? `, backup model: ${config.backupModelName}` : ''}`);

    // Create the client (openrouter specific, update this if using something else)
    return new OpenRouterClient(config);
}