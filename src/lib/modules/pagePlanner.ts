// /src/lib/modules/pagePlanner.ts

import { BaseLlmClient } from "../llm/baseClient";
import { PageContext, PromptInput } from "../types";
import { PromptHandler } from "./promptHandler";




export class PagePlanner {
    private apiClient: BaseLlmClient;
    private promptHandler: PromptHandler;

    constructor(apiClient: BaseLlmClient, promptHandler: PromptHandler) {
        this.apiClient = apiClient;
        this.promptHandler = promptHandler;
    }

    /**
     * Plan a single page
     * @param prompt User prompt input
     * @param pageContext context including story plan and page index
     * @param previousPagePlans Optional array of previous page plans for context
     * @returns Plan for the page
     */
    async planPage(prompt: PromptInput, pageContext: PageContext, previousPagePlans: string[] = []): Promise<string> {
        // Create llm prompts
        const systemPrompt = this.promptHandler.createPagePlannerSystemPrompt(prompt, pageContext);
        const userPrompt = this.promptHandler.createPagePlannerUserPrompt(prompt, pageContext, previousPagePlans);

        try {
            const response = await this.apiClient.generateContent(userPrompt, systemPrompt);

            // Show response if extended debugging enabled
            if (process.env.EXTENDED_DEBUG === 'true') {
                console.log(`\nPage Planner repsonse for page ${pageContext.currentPageIndex + 1 }: \n\n${response.content}`);
            }

            return response.content;
        } catch (error) {
            console.error(
                `Error planning page ${pageContext.currentPageIndex + 1}:`,
                error instanceof Error ? error.message : String(error)
            );
            throw new Error(
                `Failed to plan page ${pageContext.currentPageIndex + 1}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }
}