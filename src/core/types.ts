/**
 * Token usage information from an LLM call
 */
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number; // For tracking reasoning/thinking tokens separately
  searchCount?: number; // For web search usage tracking
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
 * Web search configuration
 */
export interface WebSearchConfig {
  enabled: boolean;
  maxUses?: number; // Anthropic only
  allowedDomains?: string[]; // Anthropic only
  userLocation?: string; // Anthropic only
}

/**
 * Base configuration options common to all LLM providers
 */
export interface BaseLLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
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
    effort: "low" | "medium" | "high";
  };
  webSearch?: WebSearchConfig;
  tools?: any[]; // For future tool support
}

/**
 * Anthropic-specific configuration options
 */
export interface AnthropicConfig extends BaseLLMConfig {
  provider: "anthropic";
  apiKey?: string;
  topK?: number;
  topP?: number;
  thinking?: {
    type: "enabled";
    budget_tokens: number; // Min 1024
  };
  webSearch?: WebSearchConfig;
  stream?: boolean; // Streaming flag for large responses
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
 * Google Generative AI configuration options
 */
export interface GoogleGenAIProviderConfig {
  provider: "genai";
  temperature: number;
  model: string;
  apiKey: string;
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
 * This is a discriminated union - TypeScript will enforce provider-specific fields
 * based on the provider property value
 */
export type LLMConfig =
  | OpenAIConfig
  | AnthropicConfig
  | GrokConfig
  | GoogleGenAIProviderConfig
  | OllamaConfig
  | OtherProviderConfig;

/**
 * Helper type to extract config for a specific provider
 */
export type ConfigForProvider<P extends LLMProvider> = P extends "openai"
  ? OpenAIConfig
  : P extends "anthropic"
  ? AnthropicConfig
  : P extends "grok"
  ? GrokConfig
  : P extends "ollama"
  ? OllamaConfig
  : OtherProviderConfig;

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
};

/**
 * Configuration options for an LLMNode
 */
export type BaseNodeOptions<TInput, TOutput> = {
  parser: ResponseParser<TOutput>;
} & GeneralNodeOptions<TInput, TOutput>;
