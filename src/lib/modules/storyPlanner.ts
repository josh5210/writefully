// /src/lib/modules/storyPlanner.ts

import { BaseLlmClient } from "../llm/baseClient";
import { PromptInput } from "../types";
import { PromptHandler } from "./promptHandler";

interface StoryPlanComponents {
    structure: string;
    characters: string;
    settings: string;
    narrativeElements: string;
}

export class StoryPlanner {
    private apiClient: BaseLlmClient;
    private promptHandler: PromptHandler;

    constructor(apiClient: BaseLlmClient, promptHandler: PromptHandler) {
        this.apiClient = apiClient;
        this.promptHandler = promptHandler;
    }

    // Primary method of module: create a plan for the story
    // Now uses tiered approach with backup fallback while maintaining same interface
    async planStory(prompt: PromptInput): Promise<string> {
        try {
            console.log(`[StoryPlanner] Starting tiered story planning for topic: "${prompt.topic}"`);
            
            // Use tiered approach: break into smaller, faster calls
            const components = await this.generateStoryComponentsTiered(prompt);
            
            // Integrate all components into final story plan
            const finalPlan = await this.integrateStoryPlan(prompt, components);
            
            console.log(`[StoryPlanner] Successfully completed tiered story planning`);
            return finalPlan;
            
        } catch (error) {
            console.error(`[StoryPlanner] Tiered planning failed, attempting fallback to monolithic approach:`, error);
            
            // Fallback to original monolithic approach if tiered fails
            try {
                return await this.planStoryMonolithic(prompt);
            } catch (fallbackError) {
                console.error(`[StoryPlanner] Both tiered and monolithic approaches failed:`, fallbackError);
                throw new Error(`Story planning failed: ${error instanceof Error ? error.message : String(error)}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
            }
        }
    }

    // Tiered approach: break story planning into smaller, faster tasks
    private async generateStoryComponentsTiered(prompt: PromptInput): Promise<StoryPlanComponents> {
        console.log(`[StoryPlanner] Generating story components in parallel`);
        
        // Generate components in parallel for speed
        const [structure, characters, settings, narrativeElements] = await Promise.all([
            this.generateStoryStructure(prompt),
            this.generateCharacterDevelopment(prompt),
            this.generateSettingDevelopment(prompt),
            this.generateNarrativeElements(prompt)
        ]);

        return { structure, characters, settings, narrativeElements };
    }

    // 1. Generate story structure
    private async generateStoryStructure(prompt: PromptInput): Promise<string> {
        console.log(`[StoryPlanner] Generating story structure`);
        
        const systemPrompt = this.promptHandler.createStoryStructureSystemPrompt(prompt);
        const userPrompt = this.promptHandler.createStoryStructureUserPrompt(prompt);

        try {
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'storyPlanning'
            );
            
            console.log(`[StoryPlanner] Story structure generated successfully`);
            return response.content;
            
        } catch (error) {
            console.error(`[StoryPlanner] Story structure generation failed:`, error);
            throw new Error(`Failed to generate story structure: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 2. Generate character development (using structure for context)
    private async generateCharacterDevelopment(prompt: PromptInput): Promise<string> {
        console.log(`[StoryPlanner] Generating character development`);

        // For parallel generation, we'll use a simpler character prompt without structure dependency
        // This allows parallel execution while still maintaining quality
        const systemPrompt = this.promptHandler.createCharacterDevelopmentSystemPrompt(prompt);
        
        // Create a simplified user prompt that doesn't require structure
        let userPrompt = `Create detailed character profiles for a ${prompt.pages}-page story about "${prompt.topic}"`;
        if (prompt.authorStyle) {
            userPrompt += ` in the style of ${prompt.authorStyle}`;
        }
        userPrompt += `.\n\nProvide:
        - Main character profiles with motivations and traits
        - Key supporting characters
        - Character relationships and conflicts
        - How characters evolve throughout the story`;

        try {
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'storyPlanning'
            );
            
            console.log(`[StoryPlanner] Character development generated successfully`);
            return response.content;
            
        } catch (error) {
            console.error(`[StoryPlanner] Character development generation failed:`, error);
            throw new Error(`Failed to generate character development: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 3. Generate setting development
    private async generateSettingDevelopment(prompt: PromptInput): Promise<string> {
        console.log(`[StoryPlanner] Generating setting development`);

        const systemPrompt = this.promptHandler.createSettingDevelopmentSystemPrompt(prompt);
        
        // Simplified prompt for parallel execution
        let userPrompt = `Create detailed setting descriptions for a ${prompt.pages}-page story about "${prompt.topic}"`;
        if (prompt.authorStyle) {
            userPrompt += ` in the style of ${prompt.authorStyle}`;
        }
        userPrompt += `.\n\nProvide:
        - Key locations and their significance
        - Atmospheric details and mood
        - Time period and cultural context
        - How settings support the narrative`;

        try {
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'storyPlanning'
            );
            
            console.log(`[StoryPlanner] Setting development generated successfully`);
            return response.content;
            
        } catch (error) {
            console.error(`[StoryPlanner] Setting development generation failed:`, error);
            throw new Error(`Failed to generate setting development: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 4. Generate narrative elements
    private async generateNarrativeElements(prompt: PromptInput): Promise<string> {
        console.log(`[StoryPlanner] Generating narrative elements`);

        const systemPrompt = this.promptHandler.createNarrativeElementsSystemPrompt(prompt);
        
        // Simplified prompt for parallel execution
        let userPrompt = `Define the narrative elements for a ${prompt.pages}-page story about "${prompt.topic}"`;
        if (prompt.authorStyle) {
            userPrompt += ` in the style of ${prompt.authorStyle}`;
        }
        userPrompt += `.\n\nProvide:
        - Central themes and messages
        - Tone and voice guidelines
        - Key emotional beats and moments
        - Literary devices and stylistic elements to use`;

        try {
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'storyPlanning'
            );
            
            console.log(`[StoryPlanner] Narrative elements generated successfully`);
            return response.content;
            
        } catch (error) {
            console.error(`[StoryPlanner] Narrative elements generation failed:`, error);
            throw new Error(`Failed to generate narrative elements: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 5. Integrate all components into final story plan
    private async integrateStoryPlan(prompt: PromptInput, components: StoryPlanComponents): Promise<string> {
        console.log(`[StoryPlanner] Integrating story plan components`);

        const systemPrompt = this.promptHandler.createStoryPlanIntegrationSystemPrompt(prompt);
        const userPrompt = this.promptHandler.createStoryPlanIntegrationUserPrompt(
            prompt, 
            components.structure, 
            components.characters, 
            components.settings, 
            components.narrativeElements
        );

        try {
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'storyPlanning'
            );
            
            console.log(`[StoryPlanner] Story plan integration completed successfully`);
            return response.content;
            
        } catch (error) {
            console.error(`[StoryPlanner] Story plan integration failed:`, error);
            throw new Error(`Failed to integrate story plan: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Fallback: Original monolithic approach
    private async planStoryMonolithic(prompt: PromptInput): Promise<string> {
        console.log(`[StoryPlanner] Using monolithic story planning as fallback`);
        
        const systemPrompt = this.promptHandler.createStoryPlannerSystemPrompt(prompt);
        const userPrompt = this.promptHandler.createStoryPlannerUserPrompt(prompt);

        try {
            // Use longer timeout for monolithic approach and backup fallback
            const response = await this.apiClient.generateContentWithFallback(
                userPrompt, 
                systemPrompt, 
                'storyPlanning'
            );

            console.log(`[StoryPlanner] Monolithic story planning completed successfully`);
            return response.content;

        } catch (error) {
            console.error(`[StoryPlanner] Monolithic story planning failed:`, error);
            throw new Error(`Failed to generate story plan (monolithic): ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}