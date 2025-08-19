import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenAIUsage() {
    console.log("=== Testing OpenAI Usage Data ===");
    
    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.5,
        maxTokens: 100,
        openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    try {
        const response = await model.call([new HumanMessage("Say hello in 10 words")]);
        
        console.log("\nResponse type:", typeof response);
        console.log("Response constructor:", response.constructor.name);
        console.log("\nResponse properties:", Object.keys(response));
        console.log("\nFull response object:", JSON.stringify(response, null, 2));
        
        // Check various possible locations for usage data
        console.log("\n--- Checking usage data locations ---");
        console.log("response.usage:", (response as any).usage);
        console.log("response._llmResult:", (response as any)._llmResult);
        console.log("response.response_metadata:", (response as any).response_metadata);
        console.log("response.additional_kwargs:", (response as any).additional_kwargs);
        
        // Try invoke method which might return more metadata
        console.log("\n=== Testing with invoke method ===");
        const invokeResponse = await model.invoke([new HumanMessage("Say goodbye in 10 words")]);
        console.log("\nInvoke response type:", typeof invokeResponse);
        console.log("Invoke response constructor:", invokeResponse.constructor.name);
        console.log("Invoke response properties:", Object.keys(invokeResponse));
        
        // Check for usage_metadata
        console.log("\nInvoke response.usage_metadata:", (invokeResponse as any).usage_metadata);
        console.log("Invoke response.response_metadata:", (invokeResponse as any).response_metadata);
        
        // Try with callbacks to capture usage
        console.log("\n=== Testing with callbacks ===");
        const callbackResponse = await model.invoke(
            [new HumanMessage("Count to 5")],
            {
                callbacks: [{
                    handleLLMEnd: (output: any) => {
                        console.log("\nCallback output:", JSON.stringify(output, null, 2));
                    }
                }]
            }
        );
        
    } catch (error) {
        console.error("Error testing OpenAI:", error);
    }
}

async function testAnthropicUsage() {
    console.log("\n\n=== Testing Anthropic Usage Data ===");
    
    const model = new ChatAnthropic({
        modelName: "claude-3-haiku-20240307",
        temperature: 0.5,
        maxTokens: 100,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });
    
    try {
        const response = await model.call([new HumanMessage("Say hello in 10 words")]);
        
        console.log("\nResponse type:", typeof response);
        console.log("Response constructor:", response.constructor.name);
        console.log("\nResponse properties:", Object.keys(response));
        console.log("\nFull response object:", JSON.stringify(response, null, 2));
        
        // Check various possible locations for usage data
        console.log("\n--- Checking usage data locations ---");
        console.log("response.usage:", (response as any).usage);
        console.log("response._llmResult:", (response as any)._llmResult);
        console.log("response.response_metadata:", (response as any).response_metadata);
        console.log("response.additional_kwargs:", (response as any).additional_kwargs);
        
        // Try invoke method
        console.log("\n=== Testing with invoke method ===");
        const invokeResponse = await model.invoke([new HumanMessage("Say goodbye in 10 words")]);
        console.log("\nInvoke response.usage_metadata:", (invokeResponse as any).usage_metadata);
        console.log("Invoke response.response_metadata:", (invokeResponse as any).response_metadata);
        
    } catch (error) {
        console.error("Error testing Anthropic:", error);
    }
}

async function main() {
    const provider = process.argv[2];
    
    if (!provider || provider === 'openai') {
        if (process.env.OPENAI_API_KEY) {
            await testOpenAIUsage();
        } else {
            console.log("Skipping OpenAI test - no API key found");
        }
    }
    
    if (!provider || provider === 'anthropic') {
        if (process.env.ANTHROPIC_API_KEY) {
            await testAnthropicUsage();
        } else {
            console.log("Skipping Anthropic test - no API key found");
        }
    }
}

// Export for use with run_example.ts
export default main;

// Run if called directly
if (require.main === module) {
    main();
}