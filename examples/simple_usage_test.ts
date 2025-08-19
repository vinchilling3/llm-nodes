import { LLMNode, TextNode } from "../src";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testUsageRecording() {
    console.log("=== Testing Usage Recording ===");
    
    // Test with a simple text node
    const textNode = new TextNode({
        promptTemplate: "Tell me a joke about {{topic}}",
        llmConfig: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            maxTokens: 100
        }
    });
    
    try {
        // Execute the node
        const result = await textNode.execute({ topic: "programming" });
        console.log("\nResponse:", result);
        
        // Check usage records
        const records = textNode.getUsageRecords();
        console.log("\nUsage Records Count:", records.length);
        console.log("Usage Records:", JSON.stringify(records, null, 2));
        
        // Check total usage
        const totalUsage = textNode.getTotalTokenUsage();
        console.log("\nTotal Token Usage:", totalUsage);
        
    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the test
async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.log("Please set OPENAI_API_KEY environment variable");
        return;
    }
    
    await testUsageRecording();
}

export default main;

if (require.main === module) {
    main();
}