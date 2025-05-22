import { GeneralNodeOptions } from "..";
import { LLMNode } from "../core/LLMNode";
import { PromptTemplate } from "../core/types";
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
    constructor(options: GeneralNodeOptions<TInput, string>) {
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

    // Methods getPromptTemplate and getLLMConfig are inherited from parent class
}
