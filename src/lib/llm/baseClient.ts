// /src/lib/llm/baseClient.ts
import { ChatMessage, LlmApiConfig, LlmResponse } from "../types"
import { EnhancedLlmApiConfig } from "./config"

/**
 * Abstract base class for LLM API clients.
 * Provides common functionality and defines interface
 */
export abstract class BaseLlmClient {
    protected config: EnhancedLlmApiConfig;
    private usingBackupModel: boolean = false;

    constructor(config: LlmApiConfig | EnhancedLlmApiConfig) {
        // Ensure we have enhanced config with timeouts
        this.config = {
            ...config,
            timeouts: ('timeouts' in config && config.timeouts) ? config.timeouts : {
                storyPlanning: 40000,
                pageGeneration: 45000,
                default: 30000
            }
        } as EnhancedLlmApiConfig;
    }

    /**
     * Send a request to the LLM API
     * @param messages Array of chat messages
     * @param systemPrompt Optional system prompt 
     * @returns Promise resolving to LLM response
     */
    abstract sendRequest(
        messages: ChatMessage[],
        systemPrompt?: string
    ): Promise<LlmResponse>;

    /**
     * Enhanced method to send request with backup model fallback
     * @param messages Array of chat messages
     * @param systemPrompt Optional system prompt
     * @param operationType Type of operation for timeout configuration
     * @returns Promise resolving to LLM response
     */
    async sendRequestWithFallback(
        messages: ChatMessage[], 
        systemPrompt?: string, 
        operationType: 'storyPlanning' | 'pageGeneration' | 'default' = 'default'
    ): Promise<LlmResponse> {
        const timeout = this.config.timeouts[operationType];
        
        try {
            console.log(`[LLM] Attempting ${operationType} with primary model: ${this.getCurrentModelName()}, timeout: ${timeout}ms`);
            
            const result = await this.executeWithTimeout(
                () => this.sendRequest(messages, systemPrompt),
                timeout
            );
            
            console.log(`[LLM] ${operationType} succeeded with ${this.usingBackupModel ? 'backup' : 'primary'} model`);
            return result;
            
        } catch (error) {
            const isTimeoutError = error instanceof Error && error.message.includes('timed out');
            
            if (isTimeoutError && !this.usingBackupModel && this.config.backupModelName) {
                console.warn(`[LLM] Primary model timed out for ${operationType}, falling back to backup model: ${this.config.backupModelName}`);
                
                try {
                    this.switchToBackupModel();
                    
                    const result = await this.executeWithTimeout(
                        () => this.sendRequest(messages, systemPrompt),
                        timeout
                    );
                    
                    console.log(`[LLM] ${operationType} succeeded with backup model`);
                    return result;
                    
                } catch (backupError) {
                    console.error(`[LLM] Backup model also failed for ${operationType}:`, backupError);
                    this.switchToPrimaryModel(); // Reset for next call
                    throw new Error(`Both primary and backup models failed: ${error.message} | Backup: ${backupError instanceof Error ? backupError.message : String(backupError)}`);
                } finally {
                    this.switchToPrimaryModel(); // Reset for next call
                }
            } else {
                console.error(`[LLM] ${operationType} failed with ${this.usingBackupModel ? 'backup' : 'primary'} model:`, error);
                throw error;
            }
        }
    }

    /**
     * Helper method for content generation with backup fallback
     * @param userPrompt The user's prompt text
     * @param systemPrompt Optional system prompt
     * @param operationType Type of operation for timeout configuration
     * @returns Promise with the response content and optionally token usage
     */
    async generateContentWithFallback(
        userPrompt: string, 
        systemPrompt?: string, 
        operationType: 'storyPlanning' | 'pageGeneration' | 'default' = 'default'
    ): Promise<LlmResponse> {
        return this.sendRequestWithFallback(
            [{ role: 'user', content: userPrompt }],
            systemPrompt,
            operationType
        );
    }

    /**
     * Legacy method for backward compatibility
     */
    async generateContent(userPrompt: string, systemPrompt?: string): Promise<LlmResponse> {
        return this.generateContentWithFallback(userPrompt, systemPrompt, 'default');
    }

    /**
     * Switch to backup model
     */
    private switchToBackupModel(): void {
        if (this.config.backupModelName) {
            this.usingBackupModel = true;
        }
    }

    /**
     * Switch back to primary model
     */
    private switchToPrimaryModel(): void {
        this.usingBackupModel = false;
    }

    /**
     * Get current model name being used
     */
    public getCurrentModelName(): string {
        return this.usingBackupModel && this.config.backupModelName 
            ? this.config.backupModelName 
            : this.config.modelName;
    }

    /**
     * Execute operation with timeout
     */
    private async executeWithTimeout<T>(
        operation: () => Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            operation()
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }
}