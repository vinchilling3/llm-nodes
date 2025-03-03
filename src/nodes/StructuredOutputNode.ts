import { z } from "zod";
import { LLMNode } from "../core/LLMNode";
import { LLMConfig, ResponseParser, PromptTemplate } from "../core/types";

/**
 * StructuredOutputNode
 *
 * A specialized LLMNode for handling structured data extraction with strong schema validation.
 * This node uses Zod for validation and provides retry logic for malformed outputs.
 *
 * Key features:
 * - Schema-based validation using Zod
 * - Automatic retries for invalid responses
 * - Detailed error handling for malformed outputs
 * - Type inference from Zod schema
 *
 * Example use cases:
 * - Extracting structured product information from descriptions
 * - Parsing financial data from unstructured text
 * - Creating API responses with validated structure
 * - Converting free text to structured database entries
 */
export class StructuredOutputNode<TInput, TOutput> extends LLMNode<
    TInput,
    TOutput
> {
    /**
     * Zod schema used to validate and parse the LLM output
     * @private
     */
    private schema: z.Schema<TOutput>;

    /**
     * Maximum number of retries when validation fails
     * @private
     */
    private maxRetries: number;

    /**
     * Creates a new StructuredOutputNode
     *
     * @param options Configuration options
     * @param options.schema Zod schema that defines the expected output structure
     * @param options.promptTemplate Template for generating LLM prompts
     * @param options.llmConfig LLM configuration options
     * @param options.maxRetries Maximum number of retry attempts for invalid responses (default: 2)
     * @param options.invalidResponseTemplate Optional template to use when sending followup on invalid responses
     *
     * Implementation notes:
     * - The constructor should set up the schema and create a custom parser function
     * - The parser should attempt to validate against the schema and throw detailed errors
     * - We'll need to capture schema validation errors and retry with more explicit instructions
     */
    constructor(options: {
        schema: z.Schema<TOutput>;
        promptTemplate: PromptTemplate<TInput>;
        llmConfig: LLMConfig;
        maxRetries?: number;
        invalidResponseTemplate?: string;
    }) {
        // Implementation will:
        // 1. Store the schema
        // 2. Create a custom parser that applies the schema
        // 3. Set up the parent LLMNode with the parser
        // 4. Configure retry behavior
        super({
            promptTemplate: options.promptTemplate,
            llmConfig: options.llmConfig,
            parser: {} as ResponseParser<TOutput>, // Will be implemented
        });
        
        this.schema = options.schema;
        this.maxRetries = options.maxRetries ?? 2;
    }

    /**
     * Execute the node with retry logic for handling validation failures
     *
     * @param input The input data for the node
     * @returns Validated output matching the schema
     *
     * Implementation notes:
     * - Override the parent execute method to add retry logic
     * - Track retry count and provide more specific instructions on failures
     * - Handle errors from schema validation and provide helpful context
     * - On final failure, throw a detailed error with validation issues
     */
    async execute(input: TInput): Promise<TOutput> {
        // Will implement:
        // 1. Attempt to execute with parent method
        // 2. Catch validation errors
        // 3. Retry with more specific instructions if needed
        // 4. Format error messages to guide the LLM
        return {} as TOutput; // Placeholder
    }

    /**
     * Generate a more specific prompt for retry attempts
     *
     * @param input Original input
     * @param validationError Error from Zod validation
     * @param attemptCount Current retry attempt number
     * @returns Enhanced prompt with validation feedback
     *
     * Implementation notes:
     * - Format validation errors in a way the LLM can understand
     * - Include examples of valid outputs based on the schema
     * - Adapt guidance based on the specific validation error
     */
    private generateRetryPrompt(
        input: TInput,
        validationError: z.ZodError,
        attemptCount: number
    ): string {
        // Will implement:
        // 1. Extract error details from Zod error
        // 2. Format a new prompt with the errors highlighted
        // 3. Include schema expectations
        // 4. Make instructions progressively more explicit with each retry
        return ""; // Placeholder
    }
}
