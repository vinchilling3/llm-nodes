import { LLMNode } from "../core/LLMNode";
import { LLMConfig, PromptTemplate } from "../core/types";

/**
 * ClassificationResult type representing the output of a classification operation
 */
export type ClassificationResult<TCategory extends string = string> = {
    /** The selected category from the predefined options */
    category: TCategory;
    /** Confidence score between 0 and 1 */
    confidence: number;
    /** Optional explanation for the classification decision */
    explanation?: string;
};

/**
 * ClassificationNode
 *
 * A specialized LLMNode for text classification tasks with predefined categories.
 * This node ensures the output is one of the specified categories and includes a confidence score.
 *
 * Key features:
 * - Enforces output to be from predefined categories
 * - Adds confidence scoring
 * - Optional explanation for classification decisions
 * - Type-safe category definition using TypeScript literals
 * - Built-in prompt engineering for classification tasks
 *
 * Example use cases:
 * - Sentiment analysis (positive/negative/neutral)
 * - Content moderation (safe/unsafe/review)
 * - Topic classification
 * - Intent recognition in conversational AI
 * - Prioritization of support tickets
 */
export class ClassificationNode<
    TInput,
    TCategory extends string
> extends LLMNode<TInput, ClassificationResult<TCategory>> {
    /**
     * List of valid categories for classification
     * @private
     */
    private categories: TCategory[];

    /**
     * Whether to include explanation in the output
     * @private
     */
    private includeExplanation: boolean;

    /**
     * Creates a new ClassificationNode
     *
     * @param options Configuration options
     * @param options.categories Array of valid classification categories
     * @param options.promptTemplate Template for generating LLM prompts
     * @param options.llmConfig LLM configuration options
     * @param options.includeExplanation Whether to request explanation for classification (default: false)
     * @param options.defaultPrompt Whether to use the built-in classification prompt (default: true)
     *
     * Implementation notes:
     * - The constructor should validate that categories are unique
     * - We'll append category information to the user's prompt template
     * - Create a robust parser that enforces the category constraints
     * - Configure the LLM for classification tasks (lower temperature usually works better)
     */
    constructor(options: {
        categories: TCategory[];
        promptTemplate?: PromptTemplate<TInput>;
        llmConfig: LLMConfig;
        includeExplanation?: boolean;
        defaultPrompt?: boolean;
    }) {
        // Implementation will:
        // 1. Store categories for validation
        // 2. Create a specialized prompt that includes category information
        // 3. Create a parser that validates against the categories
        // 4. Set recommended LLM parameters for classification (if not overridden)
        super({
            promptTemplate: {} as PromptTemplate<TInput>, // Will be implemented
            llmConfig: options.llmConfig,
            parser: (rawResponse: string) =>
                ({} as ClassificationResult<TCategory>), // Will be implemented
        });
        
        this.categories = options.categories;
        this.includeExplanation = options.includeExplanation ?? false;
    }

    /**
     * Generate a classification-specific prompt by extending the user prompt with category information
     *
     * @param basePrompt The base prompt template
     * @returns Enhanced prompt with classification instructions
     *
     * Implementation notes:
     * - Append category options to the prompt in a standardized format
     * - Include instructions for confidence scoring
     * - Add examples of proper response format
     * - Optionally request explanation based on settings
     */
    private enhancePromptWithCategories(
        basePrompt: PromptTemplate<TInput>
    ): PromptTemplate<TInput> {
        // Will implement:
        // 1. Format categories as a list
        // 2. Add classification-specific instructions
        // 3. Include formatting requirements
        return {} as PromptTemplate<TInput>; // Placeholder
    }

    /**
     * Create a default classification prompt if none is provided
     *
     * @returns A well-structured classification prompt template
     *
     * Implementation notes:
     * - Create a generic but effective prompt for classification
     * - Include placeholders for input content
     * - Emphasize need for selecting from provided categories only
     */
    private createDefaultPrompt(): PromptTemplate<TInput> {
        // Will implement:
        // 1. Create a template string with input placeholders
        // 2. Add classification-specific instructions
        return {} as PromptTemplate<TInput>; // Placeholder
    }

    /**
     * Validate a classification result against known categories
     *
     * @param result Parsed classification result
     * @returns Validated classification result
     * @throws Error if category is invalid
     *
     * Implementation notes:
     * - Check that category is in the allowed list
     * - Validate confidence score is between 0 and 1
     * - Handle case normalization/matching
     * - Provide helpful error messages
     */
    private validateClassification(
        result: ClassificationResult<TCategory>
    ): ClassificationResult<TCategory> {
        // Will implement:
        // 1. Check category against allowed list
        // 2. Validate confidence range
        // 3. Normalize data if needed
        return result; // Placeholder
    }
}
