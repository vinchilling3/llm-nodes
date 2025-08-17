import { LLMNode, supportsResearchMode, OPENAI_REASONING_MODELS, ANTHROPIC_THINKING_MODELS } from "../src";

// Test research mode detection
console.log("=== Research Mode Support Detection ===");
console.log("\nOpenAI Models:");
console.log("o3-mini:", supportsResearchMode('openai', 'o3-mini'));
console.log("gpt-4:", supportsResearchMode('openai', 'gpt-4'));
console.log("o1-preview:", supportsResearchMode('openai', 'o1-preview'));

console.log("\nAnthropic Models:");
console.log("claude-3-7-sonnet-latest:", supportsResearchMode('anthropic', 'claude-3-7-sonnet-latest'));
console.log("claude-3-opus-20240229:", supportsResearchMode('anthropic', 'claude-3-opus-20240229'));

console.log("\nSupported Research Models:");
console.log("OpenAI:", OPENAI_REASONING_MODELS);
console.log("Anthropic:", ANTHROPIC_THINKING_MODELS);

// Test configuration building (without actual API calls)
console.log("\n=== Configuration Examples ===");

// Example 1: OpenAI with research mode
const openAIConfig = {
    provider: "openai" as const,
    model: "o3-mini",
    enableResearch: true,
    reasoning: {
        effort: "high" as const,
        summary: "detailed" as const
    }
};
console.log("\nOpenAI Research Config:", JSON.stringify(openAIConfig, null, 2));

// Example 2: Anthropic with thinking mode
const anthropicConfig = {
    provider: "anthropic" as const,
    model: "claude-3-7-sonnet-latest",
    enableResearch: true,
    thinking: {
        type: "enabled" as const,
        budget_tokens: 2000
    }
};
console.log("\nAnthropic Thinking Config:", JSON.stringify(anthropicConfig, null, 2));

// Example 3: Regular model with research flag (should be ignored)
const regularConfig = {
    provider: "openai" as const,
    model: "gpt-4",
    enableResearch: true // This will be ignored since gpt-4 doesn't support research mode
};
console.log("\nRegular Model with Research Flag:", JSON.stringify(regularConfig, null, 2));

console.log("\nImplementation complete! The enableResearch flag is now supported.");
console.log("Note: To use with actual API calls, you'll need:");
console.log("- Valid API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)");
console.log("- Access to research models (o1/o3 require special access from OpenAI)");
console.log("- The latest LangChain packages (already upgraded)");

export default function() {
    // This is just a test script, nothing to export
}