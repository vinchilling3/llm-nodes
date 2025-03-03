import { BaseChatModel } from "langchain/chat_models/base";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { SystemMessage, HumanMessage } from "langchain/schema";
import {
    IExecutable,
    LLMConfig,
    PromptTemplate,
    ResponseParser,
    NodeOptions,
} from "./types";

/**
 * LLMNode encapsulates an LLM interaction with prompt templating and response parsing
 */
export class LLMNode<TInput, TOutput> implements IExecutable<TInput, TOutput> {
    protected promptTemplate: PromptTemplate<TInput>;
    protected llm: BaseChatModel;
    protected parser: ResponseParser<TOutput>;
    protected systemPrompt?: string;

    constructor(options: NodeOptions<TInput, TOutput>) {
        this.promptTemplate = options.promptTemplate;
        this.parser = options.parser;
        this.systemPrompt = options.llmConfig.systemPrompt;

        // Initialize LLM from config
        this.llm = new ChatOpenAI({
            modelName: options.llmConfig.model,
            temperature: options.llmConfig.temperature ?? 0.7,
            maxTokens: options.llmConfig.maxTokens,
            ...options.llmConfig,
        });
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
            return String((input as any)[key] ?? "");
        });
    }

    /**
     * Execute this node with the provided input
     */
    async execute(input: TInput): Promise<TOutput> {
        const promptText = this.generatePrompt(input);

        const messages = [];

        // Add system message if provided
        if (this.systemPrompt) {
            messages.push(new SystemMessage(this.systemPrompt));
        }

        // Add user message
        messages.push(new HumanMessage(promptText));

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
