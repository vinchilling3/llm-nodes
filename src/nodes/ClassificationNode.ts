import { LLMNode } from "../core/LLMNode";
import { LLMConfig, PromptTemplate } from "../core/types";
import { jsonParser } from "../parsers/json";

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
 * - Configurable input field for flexibility
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
     * The name of the input field to use in the prompt template
     * @private
     */
    private inputField: string;

    /**
     * Creates a new ClassificationNode
     *
     * @param options Configuration options
     * @param options.categories Array of valid classification categories
     * @param options.promptTemplate Template for generating LLM prompts
     * @param options.llmConfig LLM configuration options
     * @param options.includeExplanation Whether to request explanation for classification (default: false)
     * @param options.defaultPrompt Whether to use the built-in classification prompt (default: true)
     * @param options.inputField The name of the field in the input object to use for classification (default: "input")
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
        inputField?: string;
    }) {
        // Store categories for use after super() call
        const categories = [...options.categories];
        const includeExplanation = options.includeExplanation ?? false;
        const inputField = options.inputField ?? "input"; // Default to "input" if not specified

        // Validate categories are unique
        const uniqueCategories = new Set(categories);
        if (uniqueCategories.size !== categories.length) {
            throw new Error("Classification categories must be unique");
        }

        // Set default temperature for classification if not provided
        const llmConfig = {
            ...options.llmConfig,
            temperature: options.llmConfig.temperature ?? 0.2, // Lower temperature for more deterministic results
        };

        // We need to initialize with a temporary prompt template
        // that will be replaced after super() call
        const temporaryPrompt = options.promptTemplate || `{{${inputField}}}`;

        super({
            promptTemplate: temporaryPrompt,
            llmConfig,
            parser: (rawResponse: string) => {
                try {
                    const parser =
                        jsonParser<ClassificationResult<TCategory>>();
                    const result = parser(rawResponse);
                    return this.validateClassification(result);
                } catch (error) {
                    // If JSON parsing fails, try to extract the category directly
                    // This is a fallback for when the LLM doesn't output proper JSON
                    const result =
                        this.extractClassificationFromText(rawResponse);
                    return this.validateClassification(result);
                }
            },
        });

        // Now we can safely use 'this'
        this.categories = categories;
        this.includeExplanation = includeExplanation;
        this.inputField = inputField; // Store the input field name

        // After super() is called, we can update the prompt template correctly
        const useDefaultPrompt = options.defaultPrompt ?? true;

        // Create the proper prompt template
        if (useDefaultPrompt || !options.promptTemplate) {
            const defaultPrompt = this.createDefaultPrompt();
            this.promptTemplate =
                this.enhancePromptWithCategories(defaultPrompt);
        } else {
            this.promptTemplate = this.enhancePromptWithCategories(
                options.promptTemplate
            );
        }
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
        if (typeof basePrompt === "function") {
            // If the prompt is a function, wrap it to enhance with category information
            return (input: TInput) => {
                const basePromptText = basePrompt(input);
                return this.appendClassificationInstructions(basePromptText);
            };
        } else {
            // If it's a string template, append instructions at the end
            return `${basePrompt}\n\n${this.getClassificationInstructions()}`;
        }
    }

    /**
     * Append classification-specific instructions to a prompt
     * @param prompt The base prompt text
     * @returns Enhanced prompt with classification instructions
     */
    private appendClassificationInstructions(prompt: string): string {
        return `${prompt}\n\n${this.getClassificationInstructions()}`;
    }

    /**
     * Generate the standard classification instructions
     * @returns Formatted classification instructions
     */
    private getClassificationInstructions(): string {
        const categoriesList = this.categories
            .map((cat) => `- ${cat}`)
            .join("\n");

        let instructions = `
CLASSIFICATION TASK:
Analyze the above content and classify it into exactly ONE of the following categories:
${categoriesList}

Your response MUST be in JSON format with the following structure:
{
  "category": "the_selected_category",
  "confidence": 0.95 // A number between 0 and 1 indicating your confidence level
`;

        if (this.includeExplanation) {
            instructions += `,
  "explanation": "A brief explanation of why you selected this category"
`;
        }

        instructions += `
}

Make sure to:
1. Choose ONLY ONE category from the list provided
2. Provide a confidence score between 0 and 1
3. Return valid JSON that can be parsed directly
`;

        return instructions;
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
        return `Content to classify:
{{${this.inputField}}}

`;
    }

    /**
     * Try to extract classification from text when JSON parsing fails
     * @param text Raw LLM response
     * @returns Best-effort parsed classification result
     */
    private extractClassificationFromText(
        text: string
    ): ClassificationResult<TCategory> {
        // Default values
        let category: TCategory | null = null;
        let confidence = 0.5;
        let explanation: string | undefined = undefined;

        // Try to find a category mentioned in the text
        for (const possibleCategory of this.categories) {
            if (text.toLowerCase().includes(possibleCategory.toLowerCase())) {
                category = possibleCategory;
                break;
            }
        }

        // Look for confidence values (e.g., "confidence: 0.8")
        const confidenceMatch = text.match(
            /confidence[:\s]+([0-9]*\.?[0-9]+)/i
        );
        if (confidenceMatch && confidenceMatch[1]) {
            confidence = parseFloat(confidenceMatch[1]);
        }

        // Look for explanation
        if (this.includeExplanation) {
            const explanationMatch = text.match(
                /explanation[:\s]+"?([^"]+)"?/i
            );
            if (explanationMatch && explanationMatch[1]) {
                explanation = explanationMatch[1].trim();
            }
        }

        if (!category) {
            throw new Error(
                `Could not extract a valid category from response: ${text}`
            );
        }

        return {
            category,
            confidence,
            explanation,
        };
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
        // Normalize the category with case-insensitive matching
        const normalizedCategory = this.normalizeCategory(result.category);

        // Validate category exists in our list
        if (!normalizedCategory) {
            throw new Error(
                `Invalid category "${
                    result.category
                }". Must be one of: ${this.categories.join(", ")}`
            );
        }

        // Validate confidence is between 0 and 1
        if (
            result.confidence < 0 ||
            result.confidence > 1 ||
            isNaN(result.confidence)
        ) {
            throw new Error(
                `Invalid confidence value: ${result.confidence}. Must be between 0 and 1.`
            );
        }

        // Return validated and normalized result
        return {
            category: normalizedCategory,
            confidence: result.confidence,
            explanation: result.explanation,
        };
    }

    /**
     * Normalize category input against the allowed categories
     * @param category Category string to normalize
     * @returns Normalized category from the allowed list or null if not found
     */
    private normalizeCategory(category: string): TCategory | null {
        // Check for exact match first
        if (this.categories.includes(category as TCategory)) {
            return category as TCategory;
        }

        // Then try case-insensitive matching
        const lowerCategory = category.toLowerCase();
        for (const validCategory of this.categories) {
            if (validCategory.toLowerCase() === lowerCategory) {
                return validCategory;
            }
        }

        return null;
    }
}
