// /src/lib/llm/llmApiInterfaces.ts

import { LlmApiConfig } from "../types";
import { BaseLlmClient } from "./baseClient";
import { OpenRouterClient } from "./openRouterClient";


/**
 * Factory function to create the llm API client
 * @param configOverride optional config override
 * @returns Instance of the LLM client
 */
export function createLlmClient(configOverride?: Partial<LlmApiConfig>): BaseLlmClient {
    // Default config for llm
    const defaultConfig: LlmApiConfig = {
        apiKey: '',
        modelName: '',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxRetries: 3,
        timeout: 30000,
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

    // Create the client (openrouter specific, update this if using something else)
    return new OpenRouterClient(config);
}