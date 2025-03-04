import { LLMNode } from "../core/LLMNode";
import { LLMConfig, PromptTemplate } from "../core/types";
import { jsonParser } from "../parsers/json";

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
     * Extraction strategy to use
     * @private
     */
    private extractionStrategy: "direct" | "iterative";

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
        // Store configuration for use after super() call
        const fields = [...options.fields];
        const includeConfidence = options.includeConfidence ?? true;
        const extractionStrategy = options.extractionStrategy ?? "direct";
        
        // Validate field names are unique
        const fieldNames = fields.map(field => field.name);
        const uniqueFieldNames = new Set(fieldNames);
        if (uniqueFieldNames.size !== fieldNames.length) {
            throw new Error("Field names for extraction must be unique");
        }

        // Configure for extraction tasks
        const llmConfig = {
            ...options.llmConfig,
            temperature: options.llmConfig.temperature ?? 0.3, // Lower temperature for more accurate extraction
        };

        // Call super first with the original prompt
        super({
            promptTemplate: options.promptTemplate,
            llmConfig,
            parser: (rawResponse: string) => this.parseExtractionResult(rawResponse),
        });

        // Now we can safely use 'this'
        this.fields = fields;
        this.includeConfidence = includeConfidence;
        this.extractionStrategy = extractionStrategy;
        
        // After super() is called, we can enhance the prompt template
        this.promptTemplate = this.createExtractionPrompt(options.promptTemplate);
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
        if (typeof basePrompt === "function") {
            // If the prompt is a function, wrap it to enhance with extraction information
            return (input: TInput) => {
                const basePromptText = basePrompt(input);
                return this.appendExtractionInstructions(basePromptText);
            };
        } else {
            // If it's a string template, append instructions at the end
            return `${basePrompt}\n\n${this.getExtractionInstructions()}`;
        }
    }

    /**
     * Append extraction-specific instructions to a prompt
     * @param prompt The base prompt text
     * @returns Enhanced prompt with extraction instructions
     */
    private appendExtractionInstructions(prompt: string): string {
        return `${prompt}\n\n${this.getExtractionInstructions()}`;
    }

    /**
     * Generate the standard extraction instructions with field details
     * @returns Formatted extraction instructions
     */
    private getExtractionInstructions(): string {
        // Format field information in a clean, tabular way
        const fieldsTable = this.fields.map(field => {
            const requiredStr = field.required === false ? "Optional" : "Required";
            const exampleStr = field.example ? `Example: "${field.example}"` : "";
            const formatStr = field.format ? `Format: ${field.format}` : "";
            
            return `- ${field.name}: ${field.description} (${requiredStr}) ${exampleStr} ${formatStr}`.trim();
        }).join('\n');

        let instructions = `
EXTRACTION TASK:
Extract the following fields from the above content:
${fieldsTable}

Your response MUST be in JSON format with the following structure:
{
  "data": {
`;

        // Add expected fields to the example
        this.fields.forEach((field, index) => {
            const comma = index < this.fields.length - 1 ? "," : "";
            const example = field.example ? field.example : 
                field.format === "number" ? "42" :
                field.format === "date" ? "2023-01-01" :
                field.format === "list" ? '["item1", "item2"]' : '"extracted value"';
            
            instructions += `    "${field.name}": ${example}${comma}\n`;
        });

        instructions += `  }`;

        // Add confidence scores section if enabled
        if (this.includeConfidence) {
            instructions += `,
  "confidences": {
`;

            // Add expected confidence fields
            this.fields.forEach((field, index) => {
                const comma = index < this.fields.length - 1 ? "," : "";
                instructions += `    "${field.name}": 0.95${comma} // Confidence score between 0 and 1\n`;
            });

            instructions += `  }`;
        }

        // Add warnings section (always included for potential issues)
        instructions += `,
  "warnings": [
    "Only include warnings if there are issues with extraction",
    "For example: 'Could not find phone number in the text'"
  ]
}

Make sure to:
1. Extract ALL fields listed above
2. For required fields, make your best effort to extract them
3. For optional fields, include them only if you find them
4. Return 'null' for fields you cannot extract, do not omit them
5. Return valid JSON that can be parsed directly
`;

        if (this.includeConfidence) {
            instructions += `6. Include confidence scores (0-1) for each extracted field
`;
        }

        return instructions;
    }

    /**
     * Execute node with chosen strategy
     */
    async execute(input: TInput): Promise<ExtractionResult<TOutput>> {
        if (this.extractionStrategy === "iterative") {
            return this.executeIterative(input);
        }
        
        // Default to direct extraction
        return super.execute(input);
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
        // Initialize result objects
        const data = {} as TOutput;
        const confidences: Record<string, number> = {};
        const warnings: string[] = [];
        
        // Process each field with an individual LLM call
        for (const field of this.fields) {
            try {
                // Create a field-specific extraction node
                const fieldNode = new LLMNode({
                    promptTemplate: this.createFieldSpecificPrompt(field),
                    llmConfig: this.llmConfig,
                    parser: (response: string) => this.parseFieldResponse(response, field.name),
                });
                
                // Execute the field extraction
                const fieldResult = await fieldNode.execute(input);
                
                // Merge the field result into our overall results
                if (fieldResult.data !== null && fieldResult.data !== undefined) {
                    (data as any)[field.name] = fieldResult.data;
                }
                
                if (fieldResult.confidence !== undefined) {
                    confidences[field.name] = fieldResult.confidence;
                }
                
                if (fieldResult.warning) {
                    warnings.push(fieldResult.warning);
                }
            } catch (error) {
                // If extraction fails, record the error and continue
                warnings.push(`Failed to extract ${field.name}: ${(error as Error).message}`);
                
                // For required fields, this is more serious
                if (field.required !== false) {
                    warnings.push(`WARNING: Required field '${field.name}' could not be extracted`);
                }
            }
        }
        
        // Compile the final result
        const result: ExtractionResult<TOutput> = {
            data,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
        
        // Add confidences if we're using them and have some
        if (this.includeConfidence && Object.keys(confidences).length > 0) {
            result.confidences = confidences as any;
        }
        
        return result;
    }

    /**
     * Create a prompt specifically for extracting a single field
     */
    private createFieldSpecificPrompt(field: ExtractionField): PromptTemplate<TInput> {
        const fieldPrompt = `
Extract the following field from the above content:

Field: ${field.name}
Description: ${field.description}
${field.format ? `Format: ${field.format}` : ''}
${field.example ? `Example: "${field.example}"` : ''}
${field.required === false ? 'This field is optional.' : 'This field is required.'}

Your response MUST be in JSON format with the following structure:
{
  "data": "extracted value", 
  ${this.includeConfidence ? `"confidence": 0.95,` : ''} 
  "warning": "Include a warning only if there is an issue"
}

Make sure to:
1. Focus ONLY on extracting the ${field.name} field
2. Return null if you cannot find the field
3. Return valid JSON that can be parsed directly
`;

        // Create a function that adds this field prompt to the base input
        return (input: TInput) => {
            if (typeof this.promptTemplate === "function") {
                const baseText = this.promptTemplate(input);
                return `${baseText}\n\n${fieldPrompt}`;
            } else {
                const baseText = this.promptTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
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
                return `${baseText}\n\n${fieldPrompt}`;
            }
        };
    }

    /**
     * Parse a response from a single field extraction
     */
    private parseFieldResponse(
        response: string, 
        fieldName: string
    ): { data: any; confidence?: number; warning?: string } {
        try {
            const parsed = jsonParser<{ data: any; confidence?: number; warning?: string }>()(response);
            return {
                data: parsed.data,
                confidence: parsed.confidence,
                warning: parsed.warning,
            };
        } catch (error) {
            // If parsing fails, try to extract the value directly
            let match = response.match(new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`)) ||
                        response.match(new RegExp(`"${fieldName}"\\s*:\\s*(\\w+)`));

            if (match) {
                return {
                    data: match[1],
                    confidence: 0.3, // Low confidence for regex extraction
                    warning: "Value extracted through fallback method, might be inaccurate"
                };
            }

            throw new Error(`Could not extract ${fieldName} from response`);
        }
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
        // Try to parse the JSON response
        try {
            // Use the JSON parser to extract the response
            const parser = jsonParser<{
                data: TOutput;
                confidences?: Record<string, number>;
                warnings?: string[];
            }>();
            
            const parsed = parser(rawOutput);
            const warnings = parsed.warnings || [];
            
            // Validate the extracted data against field requirements
            this.fields.forEach(field => {
                const value = (parsed.data as any)[field.name];
                
                // Check if required fields are present
                if (field.required !== false && (value === undefined || value === null)) {
                    warnings.push(`Required field '${field.name}' is missing or null`);
                }
            });
            
            // Return the validated result
            return {
                data: parsed.data,
                confidences: parsed.confidences,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        } catch (error) {
            // Fallback parsing if JSON parsing fails
            // Try to extract key-value pairs using regex
            const data = {} as TOutput;
            const warnings = ["Failed to parse JSON response, falling back to regex extraction"];
            
            this.fields.forEach(field => {
                try {
                    // Try to find the field in the text
                    const regex = new RegExp(`${field.name}[\\s:"]*([\\w\\s.@\\-+]+)["\\s,}]`, 'i');
                    const match = rawOutput.match(regex);
                    
                    if (match && match[1]) {
                        (data as any)[field.name] = match[1].trim();
                    } else if (field.required !== false) {
                        warnings.push(`Could not extract required field '${field.name}'`);
                    }
                } catch (fieldError) {
                    if (field.required !== false) {
                        warnings.push(`Error extracting field '${field.name}': ${(fieldError as Error).message}`);
                    }
                }
            });
            
            return {
                data,
                warnings,
            };
        }
    }
}
