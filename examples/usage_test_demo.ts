import { LLMNode, TextNode, jsonParser } from "../src";

// Demo showing usage recording functionality
async function demonstrateUsageRecording() {
    console.log("=== Usage Recording Demo ===\n");
    
    // Create a simple text node
    const jokeNode = new TextNode({
        promptTemplate: "Tell me a short joke about {{topic}}",
        llmConfig: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            maxTokens: 50
        }
    });
    
    // Simulate the node execution (without actual API call for demo)
    console.log("1. Created a TextNode for generating jokes");
    console.log("2. When executed with a real API key, it will:");
    console.log("   - Call OpenAI's API using the invoke() method");
    console.log("   - Receive an AIMessage response with usage_metadata");
    console.log("   - Extract token counts from usage_metadata.input_tokens and output_tokens");
    console.log("   - Store the usage in usageRecords array");
    
    // Show what the usage records would look like
    console.log("\n3. After execution, you can access usage data:");
    console.log("   - getUsageRecords() returns an array of UsageRecord objects");
    console.log("   - getTotalTokenUsage() returns aggregated token counts");
    
    // Example of what the data structure looks like
    const exampleUsageRecord = {
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        tokenUsage: {
            inputTokens: 15,
            outputTokens: 23,
            researchTokens: undefined
        }
    };
    
    console.log("\n4. Example UsageRecord structure:");
    console.log(JSON.stringify(exampleUsageRecord, null, 2));
    
    // Pipeline example
    console.log("\n5. Usage tracking also works across pipelines:");
    
    const analyzeNode = new LLMNode({
        promptTemplate: "Analyze the sentiment: {{text}}",
        llmConfig: {
            provider: "openai",
            model: "gpt-4",
            maxTokens: 100
        },
        parser: jsonParser()
    });
    
    // Note: In real usage, you could use different providers
    // const summarizeNode = new TextNode({
    //     promptTemplate: "Summarize: {{analysis}}",
    //     llmConfig: {
    //         provider: "anthropic",
    //         model: "claude-3-haiku-20240307",
    //         maxTokens: 50
    //     }
    // });
    // const pipeline = analyzeNode.pipe(summarizeNode);
    
    console.log("   - Created a pipeline: analyzeNode -> summarizeNode");
    console.log("   - pipeline.getTotalTokenUsage() aggregates tokens from both nodes");
    console.log("   - Research tokens (if any) are tracked separately");
    
    // Research mode example
    console.log("\n6. Research mode token tracking:");
    console.log("   - For OpenAI o1/o3 models: tracks reasoning tokens separately");
    console.log("   - For Anthropic Claude 3.7: tracks thinking tokens separately");
    console.log("   - These appear in the 'researchTokens' field of TokenUsage");
    
    const exampleResearchUsage = {
        inputTokens: 50,
        outputTokens: 100,
        researchTokens: 500,  // Additional reasoning/thinking tokens
        totalTokens: 650
    };
    
    console.log("\n   Example research mode usage:");
    console.log(JSON.stringify(exampleResearchUsage, null, 2));
    
    console.log("\n=== Implementation Details ===");
    console.log("The fix involved:");
    console.log("1. Switching from deprecated call() to invoke() method");
    console.log("2. Reading usage data from response.usage_metadata");
    console.log("3. Mapping input_tokens -> inputTokens, output_tokens -> outputTokens");
    console.log("4. Extracting reasoning tokens from output_token_details.reasoning");
    console.log("5. Maintaining backward compatibility with older response formats");
}

// Run the demo
async function main() {
    await demonstrateUsageRecording();
    
    console.log("\n=== To Test with Real API Calls ===");
    console.log("1. Set your API keys in .env file:");
    console.log("   OPENAI_API_KEY=your_key_here");
    console.log("   ANTHROPIC_API_KEY=your_key_here");
    console.log("2. Run: npm run example simple_usage_test");
    console.log("3. Check that getUsageRecords() returns populated array");
}

export default main;

if (require.main === module) {
    main();
}