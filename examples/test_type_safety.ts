import { TextNode, OpenAIConfig, AnthropicConfig } from "../src/index";

// Test 1: This SHOULD work - correct OpenAI config
const correctOpenAI = new TextNode({
    promptTemplate: "Test",
    llmConfig: {
        provider: "openai",
        model: "gpt-4",
        reasoning: { effort: "high" }, // OpenAI-specific
    } as OpenAIConfig
});

// Test 2: This SHOULD work - correct Anthropic config  
const correctAnthropic = new TextNode({
    promptTemplate: "Test",
    llmConfig: {
        provider: "anthropic",
        model: "claude-3",
        maxTokens: 100, // Required for Anthropic
        thinking: { type: "enabled", budget_tokens: 1024 }, // Anthropic-specific
    } as AnthropicConfig
});

// Test 3: This currently WORKS but SHOULDN'T - mixed config
const mixedConfig = new TextNode({
    promptTemplate: "Test",
    llmConfig: {
        provider: "openai",
        model: "gpt-4",
        thinking: { type: "enabled", budget_tokens: 1024 }, // Anthropic feature on OpenAI!
    }
});

// Test 4: Without type assertion, TypeScript doesn't enforce provider-specific fields
const noAssertion = new TextNode({
    promptTemplate: "Test", 
    llmConfig: {
        provider: "anthropic",
        model: "claude-3",
        maxTokens: 100,
        reasoning: { effort: "high" }, // OpenAI feature on Anthropic!
    }
});

console.log("Type checking test - if this compiles, we don't have full type safety");