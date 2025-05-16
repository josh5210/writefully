// /src/lib/modules/storyPlanner.ts

import { BaseLlmClient } from "../llm/baseClient";
import { PromptInput } from "../types";
import { PromptHandler } from "./promptHandler";



export class StoryPlanner {
    private apiClient: BaseLlmClient;
    private promptHandler: PromptHandler;

    constructor(apiClient: BaseLlmClient, promptHandler: PromptHandler) {
        this.apiClient = apiClient;
        this.promptHandler = promptHandler;
    }

    // primary method of module: create a plan for the story
    async planStory(prompt: PromptInput): Promise<string> {
        // create the llm prompts based on user prompt input
        const systemPrompt = this.promptHandler.createStoryPlannerSystemPrompt(prompt);
        const userPrompt = this.promptHandler.createStoryPlannerUserPrompt(prompt);

        try {
            const response = await this.apiClient.generateContent(userPrompt, systemPrompt);

            // Simply return content of the response
            return response.content;


        } catch (error) {
            console.error('Error generating story plan:', error instanceof Error ? error.message : String(error));
            throw new Error(`Failed to generate story plan: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}