// /src/lib/modules/writer.ts

import { BaseLlmClient } from "../llm/baseClient";
import { Content, PageContext, PromptInput } from "../types";
import { PromptHandler } from "./promptHandler";




export class Writer {
    private apiClient: BaseLlmClient;
    private promptHandler: PromptHandler;

    constructor(apiClient: BaseLlmClient, promptHandler: PromptHandler) {
        this.apiClient = apiClient;
        this.promptHandler = promptHandler;
    }

    /**
     * Write the content
     * @param prompt From user input
     * @param pageContext optional additional context (i.e. what happens in previous pages)
     * @returns generated content and metadata
     */
    async write(prompt: PromptInput, pageContext?: PageContext): Promise<Content> {
        // create llm prompts
        const systemPrompt = this.promptHandler.createWriterSystemPrompt(prompt, pageContext);
        const userPrompt = this.promptHandler.createWriterUserPrompt(prompt, pageContext);

        try {
            // Generate and return content
            const response = await this.apiClient.generateContent(userPrompt, systemPrompt);

            const content: Content = {
                text: response.content,
                metadata: {
                    prompt,
                    iteration: 1,
                    timestamp: new Date(),
                    modelInfo: {
                        name: this.apiClient['config'].modelName,
                        provider: this.apiClient['config'].provider
                    }
                }
            };

            return content;
        } catch (error) {
            console.error('Error generating content:', error instanceof Error ? error.message : String(error));
            throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}