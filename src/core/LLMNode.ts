import { BaseChatModel } from "langchain/chat_models/base";
import {
    IExecutable,
    PromptTemplate,
    ResponseParser,
    NodeOptions,
    LLMConfig,
} from "./types";
import { createModel, createMessages } from "./modelFactory";

/**
 * LLMNode encapsulates an LLM interaction with prompt templating and response parsing
 */
export class LLMNode<TInput, TOutput> implements IExecutable<TInput, TOutput> {
    protected promptTemplate: PromptTemplate<TInput>;
    protected llm: BaseChatModel;
    protected parser: ResponseParser<TOutput>;
    protected llmConfig: LLMConfig;

    constructor(options: NodeOptions<TInput, TOutput>) {
        this.promptTemplate = options.promptTemplate;
        this.parser = options.parser;
        this.llmConfig = options.llmConfig;

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
     * Generate the prompt from the input data
     */
    protected generatePrompt(input: TInput): string {
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
     * Execute this node with the provided input
     */
    async execute(input: TInput): Promise<TOutput> {
        const promptText = this.generatePrompt(input);
        
        // Create messages using the factory method
        const messages = createMessages(promptText, this.llmConfig);
        
        // Call the LLM with appropriate messages
        const response = await this.llm.call(messages);

        // Parse the response
        return this.parser(response.content as string);
    }

    /**
     * Connect this node to another node, creating a pipeline
     */
    pipe<TNextOutput>(
        nextNode: IExecutable<TOutput, TNextOutput>
    ): IExecutable<TInput, TNextOutput> {
        return {
            execute: async (input: TInput): Promise<TNextOutput> => {
                const intermediateResult = await this.execute(input);
                return nextNode.execute(intermediateResult);
            },
        };
    }
}
