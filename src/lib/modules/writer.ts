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
            console.log(`[Writer] Generating content for page ${pageContext ? pageContext.currentPageIndex + 1 : 'unknown'}`);
            
            // Use pageGeneration operation type for appropriate timeout and backup fallback
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'pageGeneration'
            );

            console.log(`[Writer] Content generation successful, length: ${response.content.length} characters`);

            // Return the Content object with metadata
            return {
                text: response.content,
                metadata: {
                    prompt,
                    iteration: 1,
                    timestamp: new Date(),
                    modelInfo: {
                        name: this.apiClient.getCurrentModelName ? this.apiClient.getCurrentModelName() : 'unknown',
                        provider: 'openrouter'
                    },
                    pageNumber: pageContext?.currentPageIndex
                }
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Writer] Content generation failed:`, errorMessage);
            
            if (errorMessage.includes('timed out')) {
                console.error(`[Writer] Content generation timed out - may indicate model performance issues`);
            }
            
            throw new Error(`Failed to generate content: ${errorMessage}`);
        }
    }
}