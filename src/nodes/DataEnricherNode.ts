import { IExecutable } from "../core/types";

/**
 * DataEnricherNode
 *
 * A utility node that enriches data flowing through a pipeline with additional context.
 * This node doesn't call an LLM but transforms data by adding external information.
 *
 * Key features:
 * - Inject external data into a pipeline
 * - Transform output from previous nodes
 * - Combine static context with dynamic data
 * - Support both static values and context-generating functions
 *
 * Example use cases:
 * - Adding configuration data to pipeline
 * - Injecting database lookup results
 * - Combining outputs from parallel processes
 * - Adding user preferences to a generation flow
 * - Formatting or restructuring data between pipeline stages
 */
export class DataEnricherNode<TInput, TOutput>
    implements IExecutable<TInput, TOutput>
{
    /**
     * Function that enriches the input data with context
     * @private
     */
    private enricher: (input: TInput, context: any) => TOutput;

    /**
     * Static context data or function to generate context
     * @private
     */
    private contextSource: any | ((input: TInput) => Promise<any>);

    /**
     * Creates a new DataEnricherNode
     *
     * @param options Configuration options
     * @param options.enricher Function that combines input with context
     * @param options.context Static context object or function to generate context
     *
     * Implementation notes:
     * - The enricher transforms input + context into the output format
     * - Context can be static (object) or dynamic (async function)
     * - This node doesn't call any LLM, purely for data transformation
     */
    constructor(options: {
        enricher: (input: TInput, context: any) => TOutput;
        context: any | ((input: TInput) => Promise<any>);
    }) {
        this.enricher = options.enricher;
        this.contextSource = options.context;
    }

    /**
     * Execute the node by enriching input with context
     *
     * @param input The input data
     * @returns The enriched output
     *
     * Implementation notes:
     * - Get context (static or dynamic)
     * - Apply enricher function to combine input with context
     * - Handle async context generation
     */
    async execute(input: TInput): Promise<TOutput> {
        // Get context (either static or dynamically generated)
        let context: any;

        if (typeof this.contextSource === "function") {
            context = await this.contextSource(input);
        } else {
            context = this.contextSource;
        }

        // Apply the enricher function
        return this.enricher(input, context);
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
