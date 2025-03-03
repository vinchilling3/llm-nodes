import { IExecutable } from "../core/types";

/**
 * MergeNode
 *
 * A utility node that combines multiple inputs into a single output.
 * This node is designed for merging outputs from parallel processes.
 *
 * Key features:
 * - Combine outputs from multiple nodes
 * - Support for both array-style and named inputs
 * - Custom merger function for flexible combination logic
 * - Enables parallel processing pipelines
 *
 * Example use cases:
 * - Combining summary and key points from different models
 * - Merging multiple analyses of the same input
 * - Building composite outputs from specialized processors
 * - Creating multi-model ensembles
 * - Implementing voting or consensus mechanisms
 */
export class MergeNode<TInputs extends any[], TOutput>
    implements IExecutable<TInputs, TOutput>
{
    /**
     * Function that merges multiple inputs into a single output
     * @private
     */
    private merger: (inputs: TInputs) => TOutput;

    /**
     * Creates a new MergeNode
     *
     * @param options Configuration options
     * @param options.merger Function that combines multiple inputs into a single output
     *
     * Implementation notes:
     * - The merger function should handle all input types in the array
     * - This node doesn't call any LLM, purely for data transformation
     * - Can be used to implement ensemble methods or parallel processing
     */
    constructor(options: { merger: (inputs: TInputs) => TOutput }) {
        this.merger = options.merger;
    }

    /**
     * Execute the node by merging multiple inputs
     *
     * @param inputs The array of inputs to merge
     * @returns The merged output
     *
     * Implementation notes:
     * - Apply merger function to the array of inputs
     * - Handle type safety for the inputs array
     */
    async execute(inputs: TInputs): Promise<TOutput> {
        return this.merger(inputs);
    }

    /**
     * Connect this node to another node, creating a pipeline
     */
    pipe<TNextOutput>(
        nextNode: IExecutable<TOutput, TNextOutput>
    ): IExecutable<TInputs, TNextOutput> {
        return {
            execute: async (inputs: TInputs): Promise<TNextOutput> => {
                const intermediateResult = await this.execute(inputs);
                return nextNode.execute(intermediateResult);
            },
        };
    }

    /**
     * Helper method to create a pipeline executor that handles collecting inputs
     * from multiple source nodes and passing them to this merge node
     *
     * @param sourceNodes Array of nodes whose outputs will be merged
     * @returns A function that takes the input for all source nodes and returns the merged result
     *
     * Implementation notes:
     * - Execute all source nodes in parallel with Promise.all
     * - Ensure consistent input ordering for merger function
     */
    static createPipeline<TNodeInput, TNodeOutput extends any[], TMergeOutput>(
        sourceNodes: IExecutable<TNodeInput, any>[],
        mergeNode: MergeNode<TNodeOutput, TMergeOutput>
    ): (input: TNodeInput) => Promise<TMergeOutput> {
        return async (input: TNodeInput): Promise<TMergeOutput> => {
            // Execute all source nodes in parallel
            const outputs = await Promise.all(
                sourceNodes.map((node) => node.execute(input))
            );

            // Cast to expected input type and merge
            return mergeNode.execute(outputs as unknown as TNodeOutput);
        };
    }
}
