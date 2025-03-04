import { BaseChatModel } from "langchain/chat_models/base";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { ChatGoogleVertexAI } from "langchain/chat_models/googlevertexai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { SystemMessage, HumanMessage, BaseMessage } from "langchain/schema";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import {
    LLMConfig,
    LLMProvider,
    OpenAIConfig,
    AnthropicConfig,
    GrokConfig,
    OllamaConfig,
} from "./types";

export const DEFAULT_TEMPERATURE = 0.7;

/**
 * Type guard for OpenAI config
 */
export function isOpenAIConfig(config: LLMConfig): config is OpenAIConfig {
    return config.provider === "openai";
}

/**
 * Type guard for Anthropic config
 */
export function isAnthropicConfig(
    config: LLMConfig
): config is AnthropicConfig {
    return config.provider === "anthropic";
}

/**
 * Type guard for Grok config
 */
export function isGrokConfig(config: LLMConfig): config is GrokConfig {
    return config.provider === "grok";
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
            const {
                apiKey,
                organization,
                frequencyPenalty,
                presencePenalty,
                topP,
                ...rest
            } = config as OpenAIConfig;
            return new ChatOpenAI({
                modelName: model,
                temperature: temperature ?? DEFAULT_TEMPERATURE,
                maxTokens,
                openAIApiKey: apiKey,
                frequencyPenalty,
                presencePenalty,
                topP,
                ...rest,
            });
        }

        case "anthropic": {
            const { apiKey, topK, topP, maxTokensToSample, ...rest } =
                config as AnthropicConfig;
            return new ChatAnthropic({
                modelName: model,
                temperature: temperature ?? DEFAULT_TEMPERATURE,
                maxTokens,
                anthropicApiKey: apiKey,
                topK,
                topP,
                maxTokensToSample: maxTokensToSample ?? maxTokens,
                ...rest,
            });
        }

        case "grok": {
            // For Grok, we use the Vertex AI interface as it's a common approach
            const { apiKey, topP, ...rest } = config as GrokConfig;
            return new ChatGoogleVertexAI({
                temperature: temperature ?? DEFAULT_TEMPERATURE,
                maxOutputTokens: maxTokens,
                topP,
                ...rest,
            });
        }

        case "ollama": {
            const { baseUrl, format, keepAlive, numKeep, ...rest } =
                config as OllamaConfig;
            return new ChatOllama({
                temperature: temperature ?? DEFAULT_TEMPERATURE,
                baseUrl,
                format,
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

/**
 * Creates an array of LangChain message objects based on the input text and LLM configuration
 * @param text The user input text
 * @param config The LLM configuration
 * @returns An array of LangChain message objects
 */
export function createMessages(text: string, config: LLMConfig): BaseMessage[] {
    const messages: BaseMessage[] = [];
    const provider = config.provider;
    const systemPrompt = config.providerOptions?.systemPrompt;

    // Add system message if present and supported
    if (systemPrompt) {
        if (supportsSystemMessages(provider)) {
            messages.push(new SystemMessage(systemPrompt));
        } else {
            // For providers that don't support system messages,
            // prepend it to the user message
            text = `${systemPrompt}\n\n${text}`;
        }
    }

    // Add user message
    messages.push(new HumanMessage(text));

    return messages;
}
