import { LLMNode } from "../core/LLMNode";
import { LLMConfig, PromptTemplate } from "../core/types";
import { textParser } from "../parsers/structured";

/**
 * TextNode
 *
 * A specialized LLMNode that returns raw text output.
 * This node simplifies common text generation tasks by using the text parser by default.
 *
 * Key features:
 * - Simplified API for text generation
 * - No parser configuration needed
 * - Full access to all LLMNode capabilities
 * - Streamlined for the most common use case
 *
 * Example use cases:
 * - Content generation
 * - Text summarization
 * - Creative writing
 * - Simple question answering
 * - Description generation
 */
export class TextNode<TInput> extends LLMNode<TInput, string> {
    /**
     * Creates a new TextNode
     *
     * @param options Configuration options
     * @param options.promptTemplate Template for generating LLM prompts
     * @param options.llmConfig LLM configuration options
     *
     * Implementation notes:
     * - Simply passes the text parser to the parent LLMNode
     * - All other functionality is inherited from LLMNode
     */
    constructor(options: {
        promptTemplate: PromptTemplate<TInput>;
        llmConfig: LLMConfig;
    }) {
        super({
            promptTemplate: options.promptTemplate,
            llmConfig: options.llmConfig,
            parser: textParser(),
        });
    }

    /**
     * Additional helper method to append text to prompt template
     *
     * @param additionalText Text to append to the existing prompt template
     * @returns A new TextNode with the updated prompt
     *
     * Implementation notes:
     * - Creates a new node with combined prompt
     * - Useful for adding instructions or context to an existing node
     */
    withAdditionalPrompt(additionalText: string): TextNode<TInput> {
        const currentPrompt = this.getPromptTemplate();
        let newPrompt: PromptTemplate<TInput>;

        if (typeof currentPrompt === "string") {
            newPrompt = `${currentPrompt}\n\n${additionalText}`;
        } else {
            // If the prompt is a function, create a new function that appends text
            newPrompt = (input: TInput) => {
                return `${currentPrompt(input)}\n\n${additionalText}`;
            };
        }

        return new TextNode({
            promptTemplate: newPrompt,
            llmConfig: this.getLLMConfig(),
        });
    }

    /**
     * Get the current prompt template
     *
     * @private
     * @returns The current prompt template
     */
    private getPromptTemplate(): PromptTemplate<TInput> {
        // This will need to be implemented by exposing the promptTemplate
        // from the parent LLMNode class, or storing it in this class
        return this["promptTemplate"];
    }

    /**
     * Get the current LLM configuration
     *
     * @private
     * @returns The current LLM configuration
     */
    private getLLMConfig(): LLMConfig {
        // Access the llmConfig directly from the parent class property
        // which is protected and accessible from this subclass
        return this.llmConfig;
    }
}
