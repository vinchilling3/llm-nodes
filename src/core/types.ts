/**
 * Interface for any component that can execute with input and produce output
 */
export interface IExecutable<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic' | 'mistral' | 'grok' | 'cohere' | 'ollama' | string;

/**
 * Base configuration options common to all LLM providers
 */
export interface BaseLLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * OpenAI-specific configuration options
 */
export interface OpenAIConfig extends BaseLLMConfig {
  provider: 'openai';
  apiKey?: string;
  organization?: string;
  frequencyPenalty?: number;
  presencePenalty?: number;
  topP?: number;
}

/**
 * Anthropic-specific configuration options
 */
export interface AnthropicConfig extends BaseLLMConfig {
  provider: 'anthropic';
  apiKey?: string;
  topK?: number;
  topP?: number;
  maxTokensToSample?: number;
}

/**
 * Mistral-specific configuration options
 */
export interface MistralConfig extends BaseLLMConfig {
  provider: 'mistral';
  apiKey?: string;
  topP?: number;
  safeMode?: boolean;
  randomSeed?: number;
}

/**
 * Grok-specific configuration options
 */
export interface GrokConfig extends BaseLLMConfig {
  provider: 'grok';
  apiKey?: string;
  topP?: number;
}

/**
 * Cohere-specific configuration options
 */
export interface CohereConfig extends BaseLLMConfig {
  provider: 'cohere';
  apiKey?: string;
  k?: number;
  p?: number;
}

/**
 * Ollama-specific configuration options
 */
export interface OllamaConfig extends BaseLLMConfig {
  provider: 'ollama';
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
  | MistralConfig 
  | GrokConfig 
  | CohereConfig
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
 * Configuration options for an LLMNode
 */
export type NodeOptions<TInput, TOutput> = {
  promptTemplate: PromptTemplate<TInput>;
  llmConfig: LLMConfig;
  parser: ResponseParser<TOutput>;
};
