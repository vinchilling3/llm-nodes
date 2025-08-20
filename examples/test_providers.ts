import { TextNode } from "../src/index";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenAI() {
    console.log("Testing OpenAI provider...");
    
    const openaiNode = new TextNode<{ question: string }>({
        promptTemplate: "Answer this question briefly: {{question}}",
        llmConfig: {
            provider: "openai",
            model: "gpt-4o-mini",
            maxTokens: 100,
            temperature: 0.7
        }
    });
    
    try {
        const result = await openaiNode.execute({
            question: "What is 2+2?"
        });
        console.log("OpenAI Response:", result);
        
        const usage = openaiNode.getTotalTokenUsage();
        console.log("Token Usage:", usage);
    } catch (error) {
        console.error("OpenAI Error:", error);
    }
}

async function testAnthropic() {
    console.log("\nTesting Anthropic provider...");
    
    const anthropicNode = new TextNode<{ question: string }>({
        promptTemplate: "Answer this question briefly: {{question}}",
        llmConfig: {
            provider: "anthropic",
            model: "claude-3-haiku-20240307",
            maxTokens: 100,  // Required for Anthropic
            temperature: 0.7
        }
    });
    
    try {
        const result = await anthropicNode.execute({
            question: "What is 2+2?"
        });
        console.log("Anthropic Response:", result);
        
        const usage = anthropicNode.getTotalTokenUsage();
        console.log("Token Usage:", usage);
    } catch (error) {
        console.error("Anthropic Error:", error);
    }
}

async function testWithSystemPrompt() {
    console.log("\nTesting with system prompt...");
    
    const nodeWithSystem = new TextNode<{ topic: string }>({
        promptTemplate: "Tell me about {{topic}}",
        llmConfig: {
            provider: "openai",
            model: "gpt-4o-mini",
            maxTokens: 150,
            providerOptions: {
                systemPrompt: "You are a helpful assistant that responds in a pirate voice."
            }
        }
    });
    
    try {
        const result = await nodeWithSystem.execute({
            topic: "the weather"
        });
        console.log("Response with system prompt:", result);
    } catch (error) {
        console.error("Error:", error);
    }
}

async function main() {
    // Test OpenAI provider
    await testOpenAI();
    
    // Test Anthropic provider
    await testAnthropic();
    
    // Test with system prompt
    await testWithSystemPrompt();
}

main().catch(console.error);