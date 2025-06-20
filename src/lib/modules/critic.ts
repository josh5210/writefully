// /src/lib/modules/critic.ts

import { BaseLlmClient } from "../llm/baseClient";
import { Content, PageContext, PromptInput } from "../types";
import { PromptHandler } from "./promptHandler";


export class Critic {
    private apiClient: BaseLlmClient;
    private promptHandler: PromptHandler;

    constructor(apiClient: BaseLlmClient, promptHandler: PromptHandler) {
        this.apiClient = apiClient;
        this.promptHandler = promptHandler;
    }

    /**
     * Critique the content
     * @param content From writer or editor
     * @param originalPrompt From user
     * @param pageContext when multipage length story
     * @returns string, paragraph-style critique
     */
    async evaluate(content: Content, originalPrompt: PromptInput, pageContext?: PageContext): Promise<string> {
        // Create llm prompts
        const systemPrompt = this.promptHandler.createCriticSystemPrompt(originalPrompt, pageContext);
        const userPrompt = this.promptHandler.createCriticUserPrompt(content.text, originalPrompt, pageContext);

        try {
            console.log(`[Critic] Evaluating content for page ${pageContext ? pageContext.currentPageIndex + 1 : 'unknown'}`);
            
            // Use default operation type with backup fallback
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'default'
            );

            console.log(`[Critic] Content evaluation completed, critique length: ${response.content.length} characters`);

            // Show the response if we want extended debugging
            if (process.env.EXTENDED_DEBUG === 'true') {
                console.log(`\nCritic response: \n\n${response.content}\n`);
            }

            return response.content;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Critic] Content evaluation failed:`, errorMessage);

            if (errorMessage.includes('timed out')) {
                console.error(`[Critic] Content evaluation timed out - may indicate model performance issues`);
            }

            // Return a simple critique to avoid blocking story generation
            return "Unable to generate detailed critique at this time.";
        }
    }
}