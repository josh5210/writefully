// src/lib/services/storyService.ts
import { DatabaseOrchestrator } from "../modules/databaseOrchestrator";
import { createLlmConfig } from "../llm/config";
import { createLlmClient } from "../llm/llmApiInterfaces";
import { Critic } from "../modules/critic";
import { Editor } from "../modules/editor";
import { PagePlanner } from "../modules/pagePlanner";
import { PromptHandler } from "../modules/promptHandler";
import { StoryPlanner } from "../modules/storyPlanner";
import { Writer } from "../modules/writer";
import { dbRepository } from "../db/repository";
import { v4 as uuidv4 } from 'uuid';
import { PromptInput } from '../types';

// Track active orchestrators to enable cancellation
const activeOrchestrators = new Map<string, DatabaseOrchestrator>();

export class StoryService {

    // Start story generation for a session
    async startGeneration(sessionId: string): Promise<void> {
        try {
            // Check if story already exists in database
            const existingStory = await dbRepository.getStoryBySessionId(sessionId);
            if (!existingStory) {
                throw new Error('Session not found in database');
            }

            if (!['pending', 'generating'].includes(existingStory.status)) {
                throw new Error(`Cannot start generation for session with status: ${existingStory.status}`);
            }

            console.log(`Starting story generation for session ${sessionId}`);
            console.log(`[${sessionId}] Topic: "${existingStory.topic}", Pages: ${existingStory.total_pages}, Quality: ${existingStory.quality}`);

            // Create database orchestrator
            console.log(`[${sessionId}] Creating database orchestrator...`);
            const orchestrator = this.createDatabaseOrchestrator();
            console.log(`[${sessionId}] Database orchestrator created`);

            // Store orchestrator for potential cancellation
            activeOrchestrators.set(sessionId, orchestrator);

            // Reconstruct prompt from database
            const prompt = {
                topic: existingStory.topic,
                pages: existingStory.total_pages,
                authorStyle: existingStory.author_style || undefined,
                artStyle: existingStory.art_style || undefined,
                readerVoice: existingStory.reader_voice || undefined,
                quality: existingStory.quality as 0 | 1 | 2
            };

            // Start generation (without await, it runs in background)
            orchestrator.generateStory(prompt, sessionId).catch((error) => {
                console.error(`Story generation failed for session ${sessionId}:`, error);
                // Database orchestrator handles its own error states
                // Clean up
                activeOrchestrators.delete(sessionId);
            }).finally(() => {
                // Clean up on success or failure
                activeOrchestrators.delete(sessionId);
            });

            console.log(`Story generation started for session ${sessionId}`);

        } catch (error) {
            console.error(`Failed to start story generation for session ${sessionId}:`, error);
            // Update database status if possible
            try {
                const story = await dbRepository.getStoryBySessionId(sessionId);
                if (story) {
                    await dbRepository.updateStoryStatus(story.id, 'failed', 
                        error instanceof Error ? error.message : String(error));
                }
            } catch (dbError) {
                console.error('Failed to update database status:', dbError);
            }
            throw error;
        }
    }

    // Create a new story session and persist to database
    async createStorySession(prompt: PromptInput): Promise<{
        sessionId: string;
        storyId: string;
        status: string;
    }> {
        const sessionId = uuidv4();
        
        try {
            const story = await dbRepository.createStory(sessionId, prompt);
            
            // Create page records
            for (let i = 0; i < prompt.pages; i++) {
                await dbRepository.createPage(story.id, i);
            }

            return {
                sessionId: story.session_id,
                storyId: story.id,
                status: story.status
            };
        } catch (error) {
            console.error('Failed to create story session:', error);
            throw new Error('Failed to create story session');
        }
    }

    // Cancel story generation for a session
    async cancelGeneration(sessionId: string): Promise<void> {
        try {
            const activeGeneration = activeOrchestrators.get(sessionId);

            if (activeGeneration) {
                console.log(`Cancelling story generation for session ${sessionId}`);

                // Call orchestrator's cancel method
                activeGeneration.cancelGeneration();

                // Clean up
                activeOrchestrators.delete(sessionId);

                console.log(`Story generation cancelled for session ${sessionId}`);
            } else {
                console.log(`No active generation found for session ${sessionId}, updating database only`);
            }

            // Update database status regardless
            const story = await dbRepository.getStoryBySessionId(sessionId);
            if (story) {
                await dbRepository.updateStoryStatus(story.id, 'cancelled');
            }

        } catch (error) {
            console.error(`Failed to cancel story generation for session ${sessionId}:`, error);
            throw error;
        }
    }

    // Get information about active generations (from database)
    async getActiveGenerations(): Promise<{ sessionId: string; storyId: string; startTime: Date }[]> {
        try {
            // Get all generating stories from database
            const generatingStories = await dbRepository.getStoriesByStatus('generating');
            
            return generatingStories.map(story => ({
                sessionId: story.session_id,
                storyId: story.id,
                startTime: story.created_at,
            }));
        } catch (error) {
            console.error('Failed to get active generations:', error);
            return [];
        }
    }

    // Get story status from database
    async getStoryStatus(sessionId: string): Promise<{
        status: string;
        progress: {
            currentPage: number;
            totalPages: number;
            completedPages: number;
            currentStep?: string;
        };
        error?: string;
        content?: {
            storyPlan?: string;
            pages: Array<{
                pageIndex: number;
                content: string;
                contentLength: number;
                iteration: number;
                completedAt?: Date;
            }>;
        };
    } | null> {
        try {
            const storyData = await dbRepository.getStoryWithPages(sessionId);
            if (!storyData) return null;

            const { story, pages } = storyData;
            const completedPages = pages.filter(p => p.status === 'completed');

            return {
                status: story.status,
                progress: {
                    currentPage: story.current_page,
                    totalPages: story.total_pages,
                    completedPages: completedPages.length,
                    currentStep: story.current_step
                },
                error: story.error_message,
                content: {
                    storyPlan: story.story_plan,
                    pages: completedPages
                        .filter(page => page.content_text != null)
                        .map(page => ({
                            pageIndex: page.page_index,
                            content: page.content_text as string,
                            contentLength: page.content_length || 0,
                            iteration: page.iteration,
                            completedAt: page.completed_at
                        }))
                }
            };
        } catch (error) {
            console.error('Failed to get story status:', error);
            return null;
        }
    }

    // Cleanup, for graceful shutdown
    async cleanup(): Promise<void> {
        console.log(`Cleaning up ${activeOrchestrators.size} active story generations...`);

        const cancellationPromises = Array.from(activeOrchestrators.keys()).map(
            sessionId => this.cancelGeneration(sessionId).catch(err =>
                console.error(`Failed to cancel session ${sessionId}:`, err)
            )
        );

        await Promise.all(cancellationPromises);
        activeOrchestrators.clear();

        console.log('Story service cleanup complete');
    }

    // Create DatabaseOrchestrator instance
    private createDatabaseOrchestrator(): DatabaseOrchestrator {
        try {
            const llmConfig = createLlmConfig();
            const llmClient = createLlmClient(llmConfig);
            const promptHandler = new PromptHandler();

            const storyPlanner = new StoryPlanner(llmClient, promptHandler);
            const pagePlanner = new PagePlanner(llmClient, promptHandler);
            const writer = new Writer(llmClient, promptHandler);
            const critic = new Critic(llmClient, promptHandler);
            const editor = new Editor(llmClient, promptHandler);

            return new DatabaseOrchestrator(storyPlanner, pagePlanner, writer, critic, editor);

        } catch (error) {
            console.error('Failed to create database orchestrator:', error);
            throw new Error(`Database orchestrator creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Create singleton instance
export const storyService = new StoryService();