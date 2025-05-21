import {
    IExecutable,
    PromptTemplate,
    ResponseParser,
    NodeOptions,
    LLMConfig,
    TokenUsage,
    UsageRecord
} from "./types";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createModel, createMessages } from "./modelFactory";

/**
 * LLMNode encapsulates an LLM interaction with prompt templating and response parsing
 */
export class LLMNode<TInput, TOutput> implements IExecutable<TInput, TOutput> {
    protected promptTemplate: PromptTemplate<TInput>;
    protected llm: BaseChatModel;
    protected inputPreprocessor: (input: TInput) => any;
    protected parser: ResponseParser<TOutput>;
    protected llmConfig: LLMConfig;
    protected usageRecords: UsageRecord[] = [];

    constructor(options: NodeOptions<TInput, TOutput>) {
        this.promptTemplate = options.promptTemplate;
        this.parser = options.parser;
        this.llmConfig = options.llmConfig;
        this.inputPreprocessor = options.inputPreprocessor || ((input) => input);

        // Ensure provider is set for backward compatibility
        const config = {
            ...options.llmConfig,
            provider: options.llmConfig.provider || "openai",
        } as LLMConfig;

        // Initialize LLM from config using the factory
        this.llm = createModel(config);
    }

    /**
     * Gets the prompt template for this node
     */
    protected getPromptTemplate(): PromptTemplate<TInput> {
        return this.promptTemplate;
    }

    /**
     * Gets the LLM configuration for this node
     */
    protected getLLMConfig(): LLMConfig {
        return this.llmConfig;
    }

    /**
     * Generate the prompt from the input data.
     * Calls the input preprocessor if provided.
     */
    protected generatePrompt(input: TInput): string {
        // Preprocess the input if a preprocessor is provided
        if (this.inputPreprocessor) {
            input = this.inputPreprocessor(input);
        }

        // If the prompt template is a function, call it with the input
        if (typeof this.promptTemplate === "function") {
            return this.promptTemplate(input);
        }

        // Simple variable substitution for string templates
        return this.promptTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
            try {
                // The expression could be complex like "keywords.join(', ')"
                // eslint-disable-next-line no-new-func
                const evalFn = new Function("input", `return ${key}`);
                return String(evalFn(input) ?? "");
            } catch (e) {
                // If evaluation fails, fall back to simple object property access
                return String((input as any)[key] ?? "");
            }
        });
    }

    /**
     * Get the formatted prompt for this node
     */
    getPrompt(input: TInput): PromptTemplate<TInput> {
        return this.generatePrompt(input);
    }

    /**
     * Execute this node with the provided input
     */
    async execute(input: TInput): Promise<TOutput> {
        const promptText = this.generatePrompt(input);

        // Create messages using the factory method
        const messages = createMessages(promptText, this.llmConfig);

        // Call the LLM with appropriate messages
        const response = await this.llm.call(messages);

        // Record token usage if available in the response
        // LangChain models add usage data in different ways depending on provider
        // @ts-ignore - Access usage info that may exist on the underlying response object
        const usage = response.usage || (response as any)._llmResult?.usage || null;
        if (usage) {
            this.recordUsage({
                inputTokens: usage.promptTokens || usage.promptTokenCount || 0,
                outputTokens: usage.completionTokens || usage.completionTokenCount || 0
            });
        }

        // Parse the response
        return this.parser(response.content as string);
    }

    /**
     * Record token usage from a model response
     */
    protected recordUsage(tokenUsage: TokenUsage): void {
        const record: UsageRecord = {
            timestamp: new Date(),
            provider: this.llmConfig.provider,
            model: this.llmConfig.model,
            tokenUsage: tokenUsage
        };

        this.usageRecords.push(record);
    }

    /**
     * Get all usage records
     */
    getUsageRecords(): UsageRecord[] {
        return [...this.usageRecords];
    }

    /**
     * Get total token usage
     */
    getTotalTokenUsage(): TokenUsage & { totalTokens: number } {
        const usage = this.usageRecords.reduce((total, record) => {
            return {
                inputTokens: total.inputTokens + record.tokenUsage.inputTokens,
                outputTokens: total.outputTokens + record.tokenUsage.outputTokens
            };
        }, { inputTokens: 0, outputTokens: 0 });

        return {
            ...usage,
            totalTokens: usage.inputTokens + usage.outputTokens
        };
    }

    /**
     * Clear usage records
     */
    clearUsageRecords(): void {
        this.usageRecords = [];
    }

    /**
     * Connect this node to another node, creating a pipeline
     */
    pipe<TNextOutput>(
        nextNode: IExecutable<TOutput, TNextOutput>
    ): IExecutable<TInput, TNextOutput> & {
        getUsageRecords(): UsageRecord[];
        getTotalTokenUsage(): TokenUsage & { totalTokens: number };
    } {
        const self = this;

        // Create pipeline with token usage tracking
        return {
            execute: async (input: TInput): Promise<TNextOutput> => {
                const intermediateResult = await self.execute(input);
                return nextNode.execute(intermediateResult);
            },

            getUsageRecords(): UsageRecord[] {
                const records = [...self.getUsageRecords()];
                if ('getUsageRecords' in nextNode) {
                    records.push(...(nextNode as any).getUsageRecords());
                }
                return records;
            },

            getTotalTokenUsage(): TokenUsage & { totalTokens: number } {
                const usage = self.getTotalTokenUsage();
                if ('getTotalTokenUsage' in nextNode) {
                    const nextUsage = (nextNode as any).getTotalTokenUsage();
                    usage.inputTokens += nextUsage.inputTokens;
                    usage.outputTokens += nextUsage.outputTokens;
                    // Recompute total tokens
                    usage.totalTokens = usage.inputTokens + usage.outputTokens;
                }
                return usage;
            }
        };
    }
}
