import OpenAI from "openai";
import { ILLMProvider, LLMResponse } from "./ILLMProvider";
import { OpenAIConfig } from "../types";

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements ILLMProvider {
    private client: OpenAI;
    readonly provider = "openai";

    constructor(apiKey?: string) {
        this.client = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
    }

    async invoke(prompt: string, config: OpenAIConfig): Promise<LLMResponse> {
        const {
            model,
            temperature,
            maxTokens,
            topP,
            frequencyPenalty,
            presencePenalty,
            reasoning,
            webSearch,
            providerOptions,
        } = config;

        // Determine API based on model
        const useResponsesAPI = this.shouldUseResponsesAPI(model);

        if (useResponsesAPI) {
            // Use responses API for newer models (GPT-5, etc.)
            const params: any = {
                model,
                input: prompt,
                max_output_tokens: maxTokens,
            };

            // Add optional parameters
            if (providerOptions?.systemPrompt) {
                params.instructions = providerOptions.systemPrompt;
            }
            if (temperature !== undefined) params.temperature = temperature;
            if (topP !== undefined) params.top_p = topP;
            if (frequencyPenalty !== undefined)
                params.frequency_penalty = frequencyPenalty;
            if (presencePenalty !== undefined)
                params.presence_penalty = presencePenalty;

            // Add reasoning if provided (for GPT-5)
            if (reasoning) {
                params.reasoning = reasoning;
            }

            // Add web search if enabled
            if (webSearch?.enabled) {
                params.tools = [{ type: "web_search" }];
            }

            try {
                const response = await this.client.responses.create(params);

                // Extract content from response output
                let content = response.output_text;

                return {
                    content,
                    usage: {
                        inputTokens: response.usage?.input_tokens || 0,
                        outputTokens: response.usage?.output_tokens || 0,
                        thinkingTokens:
                            (response.usage as any)?.reasoning_tokens || 0,
                        searchCount: (response.usage as any)?.search_count,
                    },
                    raw: response,
                };
            } catch (error: any) {
                // If responses API fails, fall back to chat completions
                if (error?.status === 404) {
                    return this.useChatCompletions(prompt, config);
                }
                throw error;
            }
        } else {
            return this.useChatCompletions(prompt, config);
        }
    }

    private async useChatCompletions(
        prompt: string,
        config: OpenAIConfig
    ): Promise<LLMResponse> {
        const {
            model,
            temperature,
            maxTokens,
            topP,
            frequencyPenalty,
            presencePenalty,
            providerOptions,
        } = config;

        // Use chat completions for older models
        const messages: any[] = [];
        if (providerOptions?.systemPrompt) {
            messages.push({
                role: "system",
                content: providerOptions.systemPrompt,
            });
        }
        messages.push({ role: "user", content: prompt });

        const params: any = {
            model,
            messages,
        };

        // Add optional parameters
        if (maxTokens !== undefined) params.max_tokens = maxTokens;
        if (temperature !== undefined) params.temperature = temperature;
        if (topP !== undefined) params.top_p = topP;
        if (frequencyPenalty !== undefined)
            params.frequency_penalty = frequencyPenalty;
        if (presencePenalty !== undefined)
            params.presence_penalty = presencePenalty;

        const response = await this.client.chat.completions.create(params);

        return {
            content: response.choices[0]?.message?.content || "",
            usage: {
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                thinkingTokens:
                    response.usage?.completion_tokens_details
                        ?.reasoning_tokens || 0,
            },
            raw: response,
        };
    }

    private shouldUseResponsesAPI(model: string): boolean {
        // Use responses API for GPT-5 and newer models
        // Note: We'll try responses API first and fall back if needed
        const responsesModels = ["gpt-5", "gpt-4o", "o1", "o3", "o4"];
        return responsesModels.some((m) => model.toLowerCase().includes(m));
    }
}
