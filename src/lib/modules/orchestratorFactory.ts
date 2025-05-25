// /src/lib/modules/orchestratorFactory.ts

import { createLlmConfig } from "../llm/config";
import { createLlmClient } from "../llm/llmApiInterfaces";
import { Critic } from "./critic";
import { Editor } from "./editor";
import { Orchestrator } from "./orchestrator";
import { PagePlanner } from "./pagePlanner";
import { PromptHandler } from "./promptHandler";
import { StoryPlanner } from "./storyPlanner";
import { Writer } from "./writer";


export function createOrchestrator(): Orchestrator {
    try {
        const llmConfig = createLlmConfig();

        const llmClient = createLlmClient(llmConfig);

        const promptHandler = new PromptHandler();

        const storyPlanner = new StoryPlanner(llmClient, promptHandler);
        const pagePlanner = new PagePlanner(llmClient, promptHandler);
        const writer = new Writer(llmClient, promptHandler);
        const critic = new Critic(llmClient, promptHandler);
        const editor = new Editor(llmClient, promptHandler);

        return new Orchestrator(storyPlanner, pagePlanner, writer, critic, editor);

    } catch (error) {
        console.error('Failed to create orchestrator:', error);
        throw new Error(`Orchestrator creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
