import {
    IExecutable,
    PromptTemplate,
    ResponseParser,
    BaseNodeOptions,
    LLMConfig,
    TokenUsage,
    UsageRecord,
} from "./types";
import { ILLMProvider } from "./providers/ILLMProvider";
import { createProvider } from "./modelFactory";

/**
 * LLMNode encapsulates an LLM interaction with prompt templating and response parsing
 */
export class LLMNode<TInput, TOutput> implements IExecutable<TInput, TOutput> {
    protected promptTemplate: PromptTemplate<TInput>;
    protected provider: ILLMProvider;
    protected inputPreprocessor: (input: TInput) => any;
    protected parser: ResponseParser<TOutput>;
    protected llmConfig: LLMConfig;
    protected usageRecords: UsageRecord[] = [];

    constructor(options: BaseNodeOptions<TInput, TOutput>) {
        this.promptTemplate = options.promptTemplate;
        this.parser = options.parser;
        this.llmConfig = options.llmConfig;
        this.inputPreprocessor =
            options.inputPreprocessor || ((input) => input);

        // Ensure provider is set for backward compatibility
        const config = {
            ...options.llmConfig,
            provider: options.llmConfig.provider || "openai",
        } as LLMConfig;

        this.llmConfig = config;

        // Initialize provider from config using the factory
        this.provider = createProvider(config);
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

        // Use provider's invoke method
        const response = await this.provider.invoke(promptText, this.llmConfig);

        // Record token usage
        if (response.usage) {
            const tokenUsage: TokenUsage = {
                inputTokens: response.usage.inputTokens,
                outputTokens: response.usage.outputTokens,
                researchTokens: response.usage.thinkingTokens, // Map thinking to research for backward compatibility
                thinkingTokens: response.usage.thinkingTokens,
                searchCount: response.usage.searchCount,
            };
            this.recordUsage(tokenUsage);
        }

        // Parse and return
        return this.parser(response.content);
    }

    /**
     * Record token usage from a model response
     */
    protected recordUsage(tokenUsage: TokenUsage): void {
        const record: UsageRecord = {
            timestamp: new Date(),
            provider: this.llmConfig.provider,
            model: this.llmConfig.model,
            tokenUsage: tokenUsage,
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
        const usage = this.usageRecords.reduce(
            (total, record) => {
                return {
                    inputTokens:
                        total.inputTokens + record.tokenUsage.inputTokens,
                    outputTokens:
                        total.outputTokens + record.tokenUsage.outputTokens,
                    researchTokens:
                        (total.researchTokens || 0) +
                        (record.tokenUsage.researchTokens || 0),
                };
            },
            { inputTokens: 0, outputTokens: 0, researchTokens: 0 }
        );

        return {
            ...usage,
            totalTokens:
                usage.inputTokens +
                usage.outputTokens +
                (usage.researchTokens || 0),
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
    pipe<TNextOutput>(nextNode: IExecutable<TOutput, TNextOutput>): IExecutable<
        TInput,
        TNextOutput
    > & {
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
                if ("getUsageRecords" in nextNode) {
                    records.push(...(nextNode as any).getUsageRecords());
                }
                return records;
            },

            getTotalTokenUsage(): TokenUsage & { totalTokens: number } {
                const usage = self.getTotalTokenUsage();
                if ("getTotalTokenUsage" in nextNode) {
                    const nextUsage = (nextNode as any).getTotalTokenUsage();
                    usage.inputTokens += nextUsage.inputTokens;
                    usage.outputTokens += nextUsage.outputTokens;
                    usage.researchTokens =
                        (usage.researchTokens || 0) +
                        (nextUsage.researchTokens || 0);
                    // Recompute total tokens
                    usage.totalTokens =
                        usage.inputTokens +
                        usage.outputTokens +
                        (usage.researchTokens || 0);
                }
                return usage;
            },
        };
    }
}
