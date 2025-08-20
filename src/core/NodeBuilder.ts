import { LLMNode } from "./LLMNode";
import { TextNode } from "../nodes/TextNode";
import { OpenAIConfig, AnthropicConfig, PromptTemplate, ResponseParser } from "./types";
import { textParser } from "../parsers/structured";

/**
 * Type-safe builder for creating LLM nodes
 * Ensures provider-specific configuration is correctly typed
 */
export class NodeBuilder {
    /**
     * Create an OpenAI-based LLMNode with type-safe configuration
     */
    static openai<TInput, TOutput>(config: {
        promptTemplate: PromptTemplate<TInput>;
        parser: ResponseParser<TOutput>;
        model: string;
        apiKey?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        reasoning?: { effort: 'low' | 'medium' | 'high' };
        webSearch?: { enabled: boolean };
        systemPrompt?: string;
    }): LLMNode<TInput, TOutput> {
        const { promptTemplate, parser, systemPrompt, ...llmOptions } = config;
        
        const llmConfig: OpenAIConfig = {
            provider: "openai",
            ...llmOptions,
            providerOptions: systemPrompt ? { systemPrompt } : undefined
        };
        
        return new LLMNode({
            promptTemplate,
            parser,
            llmConfig
        });
    }
    
    /**
     * Create an Anthropic-based LLMNode with type-safe configuration
     */
    static anthropic<TInput, TOutput>(config: {
        promptTemplate: PromptTemplate<TInput>;
        parser: ResponseParser<TOutput>;
        model: string;
        maxTokens: number; // Required for Anthropic
        apiKey?: string;
        temperature?: number;
        topK?: number;
        topP?: number;
        thinking?: { type: 'enabled'; budget_tokens: number };
        webSearch?: {
            enabled: boolean;
            maxUses?: number;
            allowedDomains?: string[];
            userLocation?: string;
        };
        stream?: boolean;
        systemPrompt?: string;
    }): LLMNode<TInput, TOutput> {
        const { promptTemplate, parser, systemPrompt, ...llmOptions } = config;
        
        const llmConfig: AnthropicConfig = {
            provider: "anthropic",
            ...llmOptions,
            providerOptions: systemPrompt ? { systemPrompt } : undefined
        };
        
        return new LLMNode({
            promptTemplate,
            parser,
            llmConfig
        });
    }
    
    /**
     * Create an OpenAI-based TextNode with type-safe configuration
     */
    static openaiText<TInput>(config: {
        promptTemplate: PromptTemplate<TInput>;
        model: string;
        apiKey?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        reasoning?: { effort: 'low' | 'medium' | 'high' };
        webSearch?: { enabled: boolean };
        systemPrompt?: string;
    }): TextNode<TInput> {
        const { promptTemplate, systemPrompt, ...llmOptions } = config;
        
        const llmConfig: OpenAIConfig = {
            provider: "openai",
            ...llmOptions,
            providerOptions: systemPrompt ? { systemPrompt } : undefined
        };
        
        return new TextNode({
            promptTemplate,
            llmConfig
        });
    }
    
    /**
     * Create an Anthropic-based TextNode with type-safe configuration
     */
    static anthropicText<TInput>(config: {
        promptTemplate: PromptTemplate<TInput>;
        model: string;
        maxTokens: number; // Required for Anthropic
        apiKey?: string;
        temperature?: number;
        topK?: number;
        topP?: number;
        thinking?: { type: 'enabled'; budget_tokens: number };
        webSearch?: {
            enabled: boolean;
            maxUses?: number;
            allowedDomains?: string[];
            userLocation?: string;
        };
        stream?: boolean;
        systemPrompt?: string;
    }): TextNode<TInput> {
        const { promptTemplate, systemPrompt, ...llmOptions } = config;
        
        const llmConfig: AnthropicConfig = {
            provider: "anthropic",
            ...llmOptions,
            providerOptions: systemPrompt ? { systemPrompt } : undefined
        };
        
        return new TextNode({
            promptTemplate,
            llmConfig
        });
    }
}