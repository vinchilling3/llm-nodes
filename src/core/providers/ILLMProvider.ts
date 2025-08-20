import { TokenUsage, LLMConfig } from "../types";

/**
 * Response from an LLM provider
 */
export interface LLMResponse {
    content: string;
    usage?: TokenUsage;
    raw?: any; // Provider-specific raw response
    thinking?: string; // For Anthropic extended thinking
}

/**
 * Interface for LLM providers
 */
export interface ILLMProvider {
    /**
     * Core invocation method for sending prompts to the LLM
     * @param prompt The prompt text to send
     * @param config The LLM configuration
     * @returns The LLM response with content and usage data
     */
    invoke(prompt: string, config: LLMConfig): Promise<LLMResponse>;
    
    /**
     * Provider identifier
     */
    readonly provider: string;
}