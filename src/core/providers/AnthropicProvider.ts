import Anthropic from "@anthropic-ai/sdk";
import { ILLMProvider, LLMResponse } from "./ILLMProvider";
import { AnthropicConfig } from "../types";

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements ILLMProvider {
    private client: Anthropic;
    readonly provider = "anthropic";

    constructor(apiKey?: string) {
        this.client = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        });
    }

    async invoke(
        prompt: string,
        config: AnthropicConfig
    ): Promise<LLMResponse> {
        const {
            model,
            temperature,
            maxTokens,
            topK,
            topP,
            thinking,
            webSearch,
            providerOptions,
            streaming,
        } = config;

        if (!maxTokens) {
            throw new Error("maxTokens is required for Anthropic models");
        }

        const params: any = {
            model,
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }],
        };

        // Add optional parameters
        if (temperature !== undefined) params.temperature = temperature;
        if (topK !== undefined) params.top_k = topK;
        if (topP !== undefined) params.top_p = topP;
        if (streaming !== undefined) params.streaming = streaming;

        // Add system prompt if provided
        if (providerOptions?.systemPrompt) {
            params.system = providerOptions.systemPrompt;
        }

        // Add extended thinking if configured
        if (thinking) {
            params.thinking = thinking;
        }

        // Add web search if configured
        if (webSearch?.enabled) {
            const toolConfig: any = {
                type: "web_search_20250305",
                name: "web_search",
            };

            // Add optional web search parameters
            if (webSearch.maxUses !== undefined) {
                toolConfig.max_uses = webSearch.maxUses;
            }
            if (webSearch.allowedDomains) {
                toolConfig.allowed_domains = webSearch.allowedDomains;
            }
            if (webSearch.userLocation) {
                toolConfig.user_location = webSearch.userLocation;
            }

            params.tools = [toolConfig];
        }

        const response = await this.client.messages.create(params);

        // Extract content and thinking
        let content = "";
        let thinkingContent = "";

        for (const block of response.content) {
            if (block.type === "text") {
                content += block.text;
            } else if ((block as any).type === "thinking") {
                thinkingContent += (block as any).text;
            }
        }

        // Calculate thinking tokens (rough estimate if not provided)
        // Anthropic includes thinking tokens in output tokens
        let thinkingTokens = 0;
        if (thinking && response.usage) {
            // Rough estimate: thinking tokens = total output - content length/4
            // This is an approximation since we don't get exact thinking token count
            const contentTokenEstimate = Math.ceil(content.length / 4);
            thinkingTokens = Math.max(
                0,
                (response.usage.output_tokens || 0) - contentTokenEstimate
            );
        }

        return {
            content,
            thinking: thinkingContent || undefined,
            usage: {
                inputTokens: response.usage?.input_tokens || 0,
                outputTokens: response.usage?.output_tokens || 0,
                thinkingTokens: thinkingTokens,
                searchCount: (response as any).usage?.search_count,
            },
            raw: response,
        };
    }
}
