import { BaseChatModel } from "langchain/chat_models/base";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { ChatMistral } from "langchain/chat_models/mistral";
import { ChatGoogleVertexAI } from "langchain/chat_models/googlevertexai";
import { ChatCohere } from "langchain/chat_models/cohere";
import { ChatOllama } from "langchain/chat_models/ollama";

import {
    LLMConfig,
    LLMProvider,
    OpenAIConfig,
    AnthropicConfig,
    MistralConfig,
    GrokConfig,
    CohereConfig,
    OllamaConfig,
} from "./types";

/**
 * Type guard for OpenAI config
 */
export function isOpenAIConfig(config: LLMConfig): config is OpenAIConfig {
    return config.provider === "openai";
}

/**
 * Type guard for Anthropic config
 */
export function isAnthropicConfig(config: LLMConfig): config is AnthropicConfig {
    return config.provider === "anthropic";
}

/**
 * Type guard for Mistral config
 */
export function isMistralConfig(config: LLMConfig): config is MistralConfig {
    return config.provider === "mistral";
}

/**
 * Type guard for Grok config
 */
export function isGrokConfig(config: LLMConfig): config is GrokConfig {
    return config.provider === "grok";
}

/**
 * Type guard for Cohere config
 */
export function isCohereConfig(config: LLMConfig): config is CohereConfig {
    return config.provider === "cohere";
}

/**
 * Type guard for Ollama config
 */
export function isOllamaConfig(config: LLMConfig): config is OllamaConfig {
    return config.provider === "ollama";
}

/**
 * Creates an instance of a chat model based on the provided configuration
 * @param config The LLM configuration
 * @returns A chat model instance
 * @throws Error if the provider is not supported
 */
export function createModel(config: LLMConfig): BaseChatModel {
    // Extract common options
    const { provider, model, maxTokens, temperature } = config;

    switch (provider) {
        case "openai": {
            const { apiKey, organization, frequencyPenalty, presencePenalty, topP, ...rest } = config as OpenAIConfig;
            return new ChatOpenAI({
                modelName: model,
                temperature: temperature ?? 0.7,
                maxTokens,
                openAIApiKey: apiKey,
                organization,
                frequencyPenalty,
                presencePenalty,
                topP,
                ...rest,
            });
        }

        case "anthropic": {
            const { apiKey, topK, topP, maxTokensToSample, ...rest } = config as AnthropicConfig;
            return new ChatAnthropic({
                modelName: model,
                temperature: temperature ?? 0.7,
                maxTokens,
                anthropicApiKey: apiKey,
                topK,
                topP,
                maxTokensToSample: maxTokensToSample ?? maxTokens,
                ...rest,
            });
        }

        case "mistral": {
            const { apiKey, topP, safeMode, randomSeed, ...rest } = config as MistralConfig;
            return new ChatMistral({
                modelName: model,
                temperature: temperature ?? 0.7,
                maxTokens,
                mistralApiKey: apiKey,
                topP,
                safePrompt: safeMode,
                randomSeed,
                ...rest,
            });
        }

        case "grok": {
            // For Grok, we use the Vertex AI interface as it's a common approach
            const { apiKey, topP, ...rest } = config as GrokConfig;
            return new ChatGoogleVertexAI({
                model,
                temperature: temperature ?? 0.7,
                maxOutputTokens: maxTokens,
                apiKey,
                topP,
                ...rest,
            });
        }

        case "cohere": {
            const { apiKey, k, p, ...rest } = config as CohereConfig;
            return new ChatCohere({
                model,
                temperature: temperature ?? 0.7,
                maxTokens,
                apiKey,
                k,
                p,
                ...rest,
            });
        }

        case "ollama": {
            const { baseUrl, format, keepAlive, numKeep, ...rest } = config as OllamaConfig;
            return new ChatOllama({
                model,
                temperature: temperature ?? 0.7,
                baseUrl,
                format,
                keepAlive,
                numKeep,
                ...rest,
            });
        }

        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}

/**
 * Get a standardized environment variable name for the API key of a provider
 * @param provider The LLM provider
 * @returns The environment variable name
 */
export function getApiKeyEnvVar(provider: LLMProvider): string {
    switch (provider) {
        case "openai":
            return "OPENAI_API_KEY";
        case "anthropic":
            return "ANTHROPIC_API_KEY";
        case "mistral":
            return "MISTRAL_API_KEY";
        case "grok":
            return "GROK_API_KEY";
        case "cohere":
            return "COHERE_API_KEY";
        default:
            return `${provider.toUpperCase()}_API_KEY`;
    }
}

/**
 * Determine if the provider supports system messages directly
 * @param provider The LLM provider
 * @returns True if the provider supports system messages
 */
export function supportsSystemMessages(provider: LLMProvider): boolean {
    return ["openai", "anthropic", "mistral"].includes(provider);
}