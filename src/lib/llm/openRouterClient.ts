// /src/lib/llm/openRouterClient.ts

import { LlmResponse } from "../types";
import { BaseLlmClient } from "./baseClient";
import { ChatMessage } from "../types";


export class OpenRouterClient extends BaseLlmClient {

    // Core request helper. Post JSON request to LLM API using fetch and simple retry/back-off
    private async postJSON<T>(
        path: string,
        body: unknown
    ): Promise<T> {
        const url = `${this.config.baseUrl}${path}`;
        let attempt = 0;
        let lastErr: unknown = null;

        while (attempt < this.config.maxRetries) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.config.apiKey}`,
                        'HTTP-Referer': this.config.refererUrl ?? 'http://localhost:3000',
                        'X-Title': this.config.appName ?? 'writefully',
                    },
                    body: JSON.stringify(body),
                });

                if (process.env.EXTENDED_DEBUG === 'true') {
                    console.log(`OpenRouter API Response Status: ${res.status}`);
                }

                if (!res.ok) {
                    throw new Error(
                        `OpenRouter ${res.status}: ${await res.text()}`
                    );
                }

                // Return json response as unknown type first for flexibility
                return (await res.json()) as T;
            } catch (err) {
                lastErr = err;
                attempt += 1;
                // Exponential back-off: 1s >> 2 >> 4
                await new Promise((r) =>
                setTimeout(r, 1000 * 2 ** (attempt - 1))
                );
            }
        }
        // Throw after retries
        throw new Error(
            `OpenRouter request failed after ${this.config.maxRetries} retries.
            Last error: ${String(lastErr)}`
        );
    }


    /**
     * Override BaseLlmClient's send request for specific openrouter api
     * @param messages array of ChatMessage
     * @param systemPrompt optional system prompt
     * @returns Promise with the response content and token usage
     */
    async sendRequest(
        messages: ChatMessage[],
        systemPrompt?: string
    ): Promise<LlmResponse> {
        const allMessages = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages;
        const currentModel = this.getCurrentModelName();

        type ORResponse = {
            choices: { message: { content: string } }[];
            usage?: {
                prompt_tokens: number;
                completion_tokens: number;
                total_tokens: number;
            };
        };

        const data = await this.postJSON<ORResponse>('/chat/completions', {
            model: currentModel,
            messages: allMessages,
            max_tokens: 4000,
        });

        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
            },
        };
    }


    /**
     * Simplified override helper method for content generation
     * @param userPrompt The user's prompt text
     * @param systemPrompt optional system prompt
     * @returns promise with the response content and optionally token usage
     */
    async generateContent(userPrompt: string, systemPrompt?: string): Promise<LlmResponse> {
        return this.sendRequest(
            [{ role: 'user', content: userPrompt }],
            systemPrompt
        );
    }


    // Can add: generateWithImages()
}