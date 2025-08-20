import { TextNode, OpenAIConfig, AnthropicConfig, LLMConfig } from "../src/index";

// The problem: LLMConfig is a union type, but TypeScript doesn't enforce
// the discriminated union without explicit type narrowing

// Example 1: This compiles but shouldn't - mixing provider features
const badConfig: LLMConfig = {
    provider: "openai",
    model: "gpt-4",
    thinking: { type: "enabled", budget_tokens: 1024 }, // Anthropic feature!
    reasoning: { effort: "high" }, // OpenAI feature - this is OK
};

// Example 2: To get proper type safety, you need to use specific config types
const goodOpenAI: OpenAIConfig = {
    provider: "openai",
    model: "gpt-4",
    reasoning: { effort: "high" }, // ✓ OK
    // thinking: { type: "enabled", budget_tokens: 1024 }, // ✗ Would error
};

const goodAnthropic: AnthropicConfig = {
    provider: "anthropic", 
    model: "claude-3",
    maxTokens: 100,
    thinking: { type: "enabled", budget_tokens: 1024 }, // ✓ OK
    // reasoning: { effort: "high" }, // ✗ Would error
};

// Example 3: Factory function with better type safety
function createTextNode<P extends "openai" | "anthropic">(
    provider: P,
    config: P extends "openai" ? Omit<OpenAIConfig, "provider"> : Omit<AnthropicConfig, "provider">
) {
    const fullConfig = { ...config, provider } as LLMConfig;
    return new TextNode({
        promptTemplate: "Test",
        llmConfig: fullConfig
    });
}

// Now this has better type checking:
const openaiNode = createTextNode("openai", {
    model: "gpt-4",
    reasoning: { effort: "high" }, // ✓ OK
    // thinking: { type: "enabled", budget_tokens: 1024 }, // ✗ Would error
});

const anthropicNode = createTextNode("anthropic", {
    model: "claude-3",
    maxTokens: 100,
    thinking: { type: "enabled", budget_tokens: 1024 }, // ✓ OK  
    // reasoning: { effort: "high" }, // ✗ Would error
});

console.log("Type safety examples compiled");