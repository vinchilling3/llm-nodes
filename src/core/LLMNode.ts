import { BaseChatModel } from "langchain/chat_models/base";
import { SystemMessage, HumanMessage, AIMessage } from "langchain/schema";
import {
    IExecutable,
    PromptTemplate,
    ResponseParser,
    NodeOptions,
    LLMConfig,
    LLMProvider,
} from "./types";
import { createModel, supportsSystemMessages } from "./modelFactory";

/**
 * LLMNode encapsulates an LLM interaction with prompt templating and response parsing
 */
export class LLMNode<TInput, TOutput> implements IExecutable<TInput, TOutput> {
    protected promptTemplate: PromptTemplate<TInput>;
    protected llm: BaseChatModel;
    protected parser: ResponseParser<TOutput>;
    protected systemPrompt?: string;
    protected llmConfig: LLMConfig;

    constructor(options: NodeOptions<TInput, TOutput>) {
        this.promptTemplate = options.promptTemplate;
        this.parser = options.parser;
        this.systemPrompt = options.llmConfig.systemPrompt;
        this.llmConfig = options.llmConfig;

        // Ensure provider is set for backward compatibility
        const config = { 
            ...options.llmConfig,
            provider: options.llmConfig.provider || "openai" 
        } as LLMConfig;

        // Initialize LLM from config using the factory
        this.llm = createModel(config);
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
                const evalFn = new Function('input', `return ${key}`);
                return String(evalFn(input) ?? "");
            } catch (e) {
                // If evaluation fails, fall back to simple object property access
                return String((input as any)[key] ?? "");
            }
        });
    }

    /**
     * Handle the system prompt based on provider capabilities
     */
    protected handleSystemPrompt(provider: LLMProvider, userPrompt: string): { 
        messages: Array<SystemMessage | HumanMessage | AIMessage>,
        options?: Record<string, any>
    } {
        const messages = [];
        let options = {};

        // Add system message based on provider support
        if (this.systemPrompt) {
            if (supportsSystemMessages(provider)) {
                // Provider supports system messages directly
                messages.push(new SystemMessage(this.systemPrompt));
            } else {
                // Provider doesn't support system messages, so we prepend it to the user message
                const combinedPrompt = `${this.systemPrompt}\n\n${userPrompt}`;
                options = { systemPrompt: this.systemPrompt };
                userPrompt = combinedPrompt;
            }
        }

        // Add user message
        messages.push(new HumanMessage(userPrompt));

        return { messages, options };
    }

    /**
     * Execute this node with the provided input
     */
    async execute(input: TInput): Promise<TOutput> {
        const promptText = this.generatePrompt(input);
        const provider = this.llmConfig.provider || "openai"; 

        // Handle system prompts differently based on provider
        const { messages, options } = this.handleSystemPrompt(provider, promptText);

        // Call the LLM with appropriate messages and options
        const response = await this.llm.call(messages, options);

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
