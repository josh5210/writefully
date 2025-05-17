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
            const response = await this.apiClient.generateContent(userPrompt, systemPrompt);

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
                    timestamp: new Date()
                }
            };

            return editedContent;
        } catch (error) {
            console.error('Error editing content:', error instanceof Error ? error.message : String(error));
            // Throw error and don't override original content
            throw new Error(`Failed to edit content: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}