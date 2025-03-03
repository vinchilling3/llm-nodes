import { LLMNode } from "../core/LLMNode";
import { LLMConfig, PromptTemplate } from "../core/types";

/**
 * Field extraction definition with metadata
 */
export type ExtractionField = {
    /** Field name to extract */
    name: string;
    /** Description of what this field represents */
    description: string;
    /** Example of the expected value (helps the LLM understand format) */
    example?: string;
    /** Whether this field is required (default: true) */
    required?: boolean;
    /** Format hint for the LLM (e.g., "date", "number", "list", etc.) */
    format?: string;
};

/**
 * ExtractionResult type with extraction confidence and potential warnings
 */
export type ExtractionResult<T> = {
    /** The extracted data */
    data: T;
    /** Confidence level for each extracted field (0-1) */
    confidences?: {
        [K in keyof T]?: number;
    };
    /** Any warnings or issues encountered during extraction */
    warnings?: string[];
};

/**
 * ExtractionNode
 *
 * A specialized LLMNode for extracting structured fields from unstructured text.
 * This node is designed to pull specific information from documents, emails, conversations, etc.
 *
 * Key features:
 * - Extract multiple named fields from text
 * - Field-level descriptions and examples
 * - Confidence scoring for extracted fields
 * - Support for required/optional fields
 * - Handles complex nested data extraction
 *
 * Example use cases:
 * - Extracting contact information from emails
 * - Pulling product specs from descriptions
 * - Converting resumes to structured data
 * - Extracting meeting details from conversations
 * - Parsing form submissions
 */
export class ExtractionNode<
    TInput,
    TOutput extends Record<string, any>
> extends LLMNode<TInput, ExtractionResult<TOutput>> {
    /**
     * Field definitions for extraction
     * @private
     */
    private fields: ExtractionField[];

    /**
     * Whether to include confidence scores
     * @private
     */
    private includeConfidence: boolean;

    /**
     * Creates a new ExtractionNode
     *
     * @param options Configuration options
     * @param options.fields Array of field definitions to extract
     * @param options.promptTemplate Template for generating LLM prompts
     * @param options.llmConfig LLM configuration options
     * @param options.includeConfidence Whether to request confidence scores for each field (default: true)
     * @param options.extractionStrategy Approach to use for extraction ("direct" or "iterative") (default: "direct")
     *
     * Implementation notes:
     * - The constructor should validate field definitions
     * - We'll enhance the prompt with field information and extraction instructions
     * - Direct extraction gets all fields at once, iterative focuses on one field at a time for complex cases
     * - The parser needs to handle both missing fields and malformed responses
     */
    constructor(options: {
        fields: ExtractionField[];
        promptTemplate: PromptTemplate<TInput>;
        llmConfig: LLMConfig;
        includeConfidence?: boolean;
        extractionStrategy?: "direct" | "iterative";
    }) {
        // Implementation will:
        // 1. Store fields for extraction
        // 2. Create specialized prompt with field information
        // 3. Configure parser to handle extraction results
        // 4. Set up extraction strategy (direct vs iterative)
        super({
            promptTemplate: {} as PromptTemplate<TInput>, // Will be implemented
            llmConfig: options.llmConfig,
            parser: (rawResponse: string) => ({} as ExtractionResult<TOutput>), // Will be implemented
        });
    }

    /**
     * Generate an enhanced prompt with field extraction instructions
     *
     * @param basePrompt The base prompt template
     * @returns Enhanced prompt with field details and extraction instructions
     *
     * Implementation notes:
     * - Format field definitions in a clear, tabular format
     * - Include examples and requirements for each field
     * - Add instructions for handling uncertain or missing fields
     * - Request confidence scoring if enabled
     */
    private createExtractionPrompt(
        basePrompt: PromptTemplate<TInput>
    ): PromptTemplate<TInput> {
        // Will implement:
        // 1. Format fields for extraction
        // 2. Add extraction-specific instructions
        // 3. Include response format requirements
        return {} as PromptTemplate<TInput>; // Placeholder
    }

    /**
     * Execute extraction with iterative strategy for complex extractions
     *
     * @param input The input data
     * @returns Extraction result with all fields
     *
     * Implementation notes:
     * - Process each field individually
     * - Maintain context between extractions
     * - Build up the output object field by field
     * - Combine confidence scores and warnings
     */
    private async executeIterative(
        input: TInput
    ): Promise<ExtractionResult<TOutput>> {
        // Will implement:
        // 1. Initialize result object
        // 2. Process each field with individual LLM calls
        // 3. Combine results into final output
        // 4. Handle errors and warnings consistently
        return {} as ExtractionResult<TOutput>; // Placeholder
    }

    /**
     * Parse and validate extraction results
     *
     * @param rawOutput The raw LLM response
     * @returns Structured extraction result
     *
     * Implementation notes:
     * - Parse JSON response into structured output
     * - Validate required fields are present
     * - Detect and record any warnings or issues
     * - Format confidence scores consistently
     */
    private parseExtractionResult(
        rawOutput: string
    ): ExtractionResult<TOutput> {
        // Will implement:
        // 1. Parse output using JSON parser
        // 2. Validate against field requirements
        // 3. Extract confidence scores if present
        // 4. Generate warnings for missing/malformed fields
        return {} as ExtractionResult<TOutput>; // Placeholder
    }
}
