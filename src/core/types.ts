/**
 * Token usage information from an LLM call
 */
export type TokenUsage = {
    inputTokens: number;
    outputTokens: number;
    researchTokens?: number; // For tracking reasoning/thinking tokens separately
};

/**
 * Record of a single LLM call usage
 */
export type UsageRecord = {
    timestamp: Date;
    provider: string;
    model: string;
    tokenUsage: TokenUsage;
};

/**
 * Interface for any component that can execute with input and produce output
 */
export interface IExecutable<TInput, TOutput> {
    execute(input: TInput): Promise<TOutput>;
}

/**
 * Supported LLM providers
 */
export type LLMProvider = "openai" | "anthropic" | "grok" | "ollama" | string;

/**
 * Base configuration options common to all LLM providers
 */
export interface BaseLLMConfig {
    provider: LLMProvider;
    model: string;
    temperature?: number;
    maxTokens?: number;
    enableResearch?: boolean; // Enable research/thinking mode for compatible models
    providerOptions?: {
        systemPrompt?: string;
        [key: string]: any;
    };
}

/**
 * OpenAI-specific configuration options
 */
export interface OpenAIConfig extends BaseLLMConfig {
    provider: "openai";
    apiKey?: string;
    organization?: string;
    frequencyPenalty?: number;
    presencePenalty?: number;
    topP?: number;
    reasoning?: {
        effort: 'low' | 'medium' | 'high';
        summary?: 'auto' | 'concise' | 'detailed';
    };
}

/**
 * Anthropic-specific configuration options
 */
export interface AnthropicConfig extends BaseLLMConfig {
    provider: "anthropic";
    apiKey?: string;
    topK?: number;
    topP?: number;
    maxTokensToSample?: number;
    thinking?: {
        type: 'enabled';
        budget_tokens: number;
    };
}

/**
 * Grok-specific configuration options
 */
export interface GrokConfig extends BaseLLMConfig {
    provider: "grok";
    apiKey?: string;
    topP?: number;
}

/**
 * Ollama-specific configuration options
 */
export interface OllamaConfig extends BaseLLMConfig {
    provider: "ollama";
    baseUrl?: string;
    format?: string;
    keepAlive?: string;
    numKeep?: number;
}

/**
 * Fallback config for any other provider
 */
export interface OtherProviderConfig extends BaseLLMConfig {
    [key: string]: any;
}

/**
 * Union type of all supported LLM configurations
 */
export type LLMConfig =
    | OpenAIConfig
    | AnthropicConfig
    | GrokConfig
    | OllamaConfig
    | OtherProviderConfig;

/**
 * A prompt template, either as a string with variables or a function
 */
export type PromptTemplate<TInput> = string | ((input: TInput) => string);

/**
 * A function that parses the raw LLM output into a structured format
 */
export type ResponseParser<TOutput> = (rawResponse: string) => TOutput;


/**
 * Configuration options for all LLM nodes
 */
export type GeneralNodeOptions<TInput, TOutput> = {
    promptTemplate: PromptTemplate<TInput>;
    llmConfig: LLMConfig;
    inputPreprocessor?: (input: TInput) => any;
}

/**
 * Configuration options for an LLMNode
 */
export type BaseNodeOptions<TInput, TOutput> = {
    parser: ResponseParser<TOutput>;
} & GeneralNodeOptions<TInput, TOutput>;
