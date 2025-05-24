import { z } from "zod";
import { LLMNode } from "../core/LLMNode";
import { LLMConfig, ResponseParser, PromptTemplate } from "../core/types";
import { jsonParser } from "../parsers/json";
import { GeneralNodeOptions } from "..";

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
     * Template to use for invalid response retries
     * @private
     */
    private invalidResponseTemplate?: string;

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
    } & GeneralNodeOptions<TInput, TOutput>) {
        // Store schema locally for parser creation
        const schema = options.schema;

        // Create a custom parser that validates against the schema
        const schemaParser: ResponseParser<TOutput> = (rawResponse: string) => {
            try {
                // First attempt to parse as JSON
                const jsonResponse = jsonParser<any>()(rawResponse);

                // Then validate against the schema
                return schema.parse(jsonResponse);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    // Rethrow Zod validation errors for retry handling
                    throw error;
                } else {
                    // Handle JSON parsing errors with proper error message
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    throw new Error(`Failed to parse response as JSON: ${errorMessage}`);
                }
            }
        };

        // Initialize parent with the schema-validating parser
        super({
            ...options,
            parser: schemaParser,
        });

        // Store configuration
        this.schema = options.schema;
        this.maxRetries = options.maxRetries ?? 2;
        this.invalidResponseTemplate = options.invalidResponseTemplate;
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
        let attemptCount = 0;
        let lastError: z.ZodError | Error | null = null;

        // Try initial execution plus retries
        while (attemptCount <= this.maxRetries) {
            try {
                // If this is the first attempt, use the original prompt
                if (attemptCount === 0) {
                    return await super.execute(input);
                }
                // For retry attempts, use an enhanced prompt with error feedback
                else if (lastError instanceof z.ZodError) {
                    // Override the prompt template temporarily for this call
                    const originalTemplate = this.promptTemplate;
                    this.promptTemplate = () =>
                        this.generateRetryPrompt(
                            input,
                            lastError as z.ZodError,
                            attemptCount
                        );

                    try {
                        return await super.execute(input);
                    } finally {
                        // Restore the original prompt template
                        this.promptTemplate = originalTemplate;
                    }
                } else {
                    // For other types of errors, just retry the original execution
                    return await super.execute(input);
                }
            } catch (error) {
                // Safely cast the error
                lastError = error instanceof Error ? error : new Error(String(error));
                attemptCount++;

                // If we've exhausted our retries, break out of the loop
                if (attemptCount > this.maxRetries) {
                    break;
                }
            }
        }

        // If we get here, all attempts failed
        if (lastError instanceof z.ZodError) {
            throw new Error(
                `Failed to generate valid output after ${attemptCount} attempts. Validation errors: ${JSON.stringify(
                    lastError.format()
                )}`
            );
        } else {
            throw lastError || new Error("Failed to execute node");
        }
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
        // Generate the original prompt to use as a base
        let originalPrompt = "";
        if (typeof this.promptTemplate === "function") {
            originalPrompt = this.promptTemplate(input);
        } else {
            originalPrompt = this.promptTemplate.replace(
                /\{\{([^}]+)\}\}/g,
                (_, key) => {
                    try {
                        const evalFn = new Function("input", `return ${key}`);
                        return String(evalFn(input) ?? "");
                    } catch (e) {
                        return String((input as any)[key] ?? "");
                    }
                }
            );
        }

        // Format error details
        const formattedErrors = Object.entries(validationError.format())
            .filter(([key]) => key !== "_errors") // Skip the top-level _errors
            .map(([path, error]) => {
                if (typeof error === "object" && error && "error" in error) {
                    const errorObj = error as any;
                    const errorMessages = errorObj.errors || errorObj.error || [];
                    return `- '${path}': ${Array.isArray(errorMessages) ? errorMessages.join(", ") : String(errorMessages)}`;
                }
                return "";
            })
            .filter(Boolean)
            .join("\n");

        // Generate schema description
        const schemaDescription = this.describeSchema(this.schema);

        // Use custom template if provided, otherwise use default retry template
        if (this.invalidResponseTemplate) {
            return this.invalidResponseTemplate
                .replace("{{original_prompt}}", originalPrompt)
                .replace("{{errors}}", formattedErrors)
                .replace("{{schema}}", schemaDescription)
                .replace("{{attempt}}", attemptCount.toString());
        }

        // Default retry template with progressively more explicit instructions
        let retryPrompt = `
I need you to provide a response in a specific JSON format, but your previous response had some issues:

${formattedErrors}

Here's the expected structure:
${schemaDescription}

${originalPrompt}

IMPORTANT: Your response MUST be valid JSON that matches the schema exactly. Do not include any explanation, markdown code blocks, or additional text outside of the JSON object.
`;

        // Add more guidance for later retry attempts
        if (attemptCount > 1) {
            retryPrompt += `\nThis is retry attempt ${attemptCount}. Please follow these strict guidelines:
1. Provide ONLY a JSON object, with no surrounding text, markdown, or explanation
2. Make sure all required fields are present and have the correct types
3. Check that all string formats (dates, emails, etc.) match the expected patterns
4. Double-check array fields have the correct item types and lengths
`;
        }

        return retryPrompt;
    }

    /**
     * Generate a human-readable description of the Zod schema
     * @private
     */
    private describeSchema(schema: z.ZodType<any>): string {
        // Simplified schema description - in a real implementation,
        // this would recursively describe the schema structure
        try {
            // Attempt to create a simplified schema description
            // Since zod's describe() method might not be available in all versions,
            // we'll create a simplified description

            // Generate a sample schema description based on the schema type
            let description: any;

            try {
                // Try to use the schema's describe method if available
                if (typeof schema.describe === 'function') {
                    // The describe method might require arguments in some versions
                    try {
                        // First try with no arguments (newer versions)
                        description = (schema.describe as any)();
                    } catch (descError) {
                        // If that fails, try with an empty object argument (older versions)
                        description = (schema.describe as any)({});
                    }
                }
            } catch (e) {
                // If schema.describe() fails, create a basic description
                description = { type: "object" };
            }

            // Ensure the schema description is properly formatted
            const formattedDescription = JSON.stringify(description || { type: "object" }, null, 2);

            if (formattedDescription === '{}' || !formattedDescription) {
                // If the schema description is empty, provide a generic fallback
                return "JSON object matching the required schema";
            }

            return formattedDescription;
        } catch (e) {
            // Fallback for complex schemas or errors
            return "JSON object matching the required schema";
        }
    }
}
