/**
 * Interface for any component that can execute with input and produce output
 */
export interface IExecutable<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Configuration options for the LLM
 */
export type LLMConfig = {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  // Allow for additional provider-specific options
  [key: string]: any;
};

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
