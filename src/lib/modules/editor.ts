// /src/lib/modules/editor.ts

import { BaseLlmClient } from "../llm/baseClient";
import { Content, PageContext, PromptInput } from "../types";
import { PromptHandler } from "./promptHandler";




export class Editor {
    private apiClient: BaseLlmClient;
    private promptHandler: PromptHandler;

    constructor(apiClient: BaseLlmClient, promptHandler: PromptHandler) {
        this.apiClient = apiClient;
        this.promptHandler = promptHandler;
    }


    /**
     * Edit the content from writer w/ critique
     * @param content from writer
     * @param originalPrompt from user
     * @param critique feedback string from critic
     * @param pageContext context for dealing with multipage stories
     * @returns edited content with updated metadata
     */
    async edit(content: Content, originalPrompt: PromptInput, critique?: string, pageContext?: PageContext): Promise<Content> {
        const systemPrompt = this.promptHandler.createEditorSystemPrompt();
        const userPrompt = this.promptHandler.createEditorUserPrompt(content.text, originalPrompt, critique, pageContext);

        try {
            console.log(`[Editor] Editing content for page ${pageContext ? pageContext.currentPageIndex + 1 : 'unknown'}`);
            
            // Use pageGeneration operation type for editing with backup fallback
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'pageGeneration'
            );

            console.log(`[Editor] Content editing completed, new length: ${response.content.length} characters`);

            // Show the response if we want extended debugging
            if (process.env.EXTENDED_DEBUG === 'true') {
                console.log(`\nEditor response: \n\n${response.content}\n`);
            }

            // Create new content object with incremented iteration
            const editedContent: Content = {
                text: response.content,
                metadata: {
                    ...content.metadata,
                    iteration: content.metadata.iteration + 1,
                    timestamp: new Date(),
                    modelInfo: {
                        name: this.apiClient.getCurrentModelName(),
                        provider: 'openrouter'
                    }
                }
            };

            return editedContent;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Editor] Content editing failed:`, errorMessage);
            
            if (errorMessage.includes('timed out')) {
                console.error(`[Editor] Content editing timed out - may indicate model performance issues`);
            }
            
            // Throw error and don't override original content
            throw new Error(`Failed to edit content: ${errorMessage}`);
        }
    }
}