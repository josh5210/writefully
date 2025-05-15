// /src/lib/llm/baseClient.ts
import { ChatMessage, LlmApiConfig, LlmResponse } from "../types"


// Abstract parent class for every LLM client regardless of provider
export abstract class BaseLlmClient {
    protected config: LlmApiConfig;

    constructor(config: LlmApiConfig) {
        this.config = config;
    }

    abstract sendRequest(
        messages: ChatMessage[],
        systemPrompt?: string
    ): Promise<LlmResponse>;

    abstract generateContent(
        userPrompt: string,
        systemPrompt?: string
    ): Promise<LlmResponse>;
}