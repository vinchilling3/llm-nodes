import { NodeBuilder, TextNode } from "../src/index";

// ✅ Type-safe OpenAI node creation
const openaiNode = NodeBuilder.openaiText({
    promptTemplate: "Tell me about {{topic}}",
    model: "gpt-4",
    temperature: 0.7,
    reasoning: { effort: "high" }, // ✓ OpenAI-specific feature
    webSearch: { enabled: true },
    systemPrompt: "You are a helpful assistant"
    // thinking: { ... } // ✗ TypeScript would error - this is Anthropic-only
});

// ✅ Type-safe Anthropic node creation  
const anthropicNode = NodeBuilder.anthropicText({
    promptTemplate: "Tell me about {{topic}}",
    model: "claude-3-sonnet",
    maxTokens: 1000, // ✓ Required for Anthropic
    thinking: { type: "enabled", budget_tokens: 2000 }, // ✓ Anthropic-specific
    webSearch: {
        enabled: true,
        maxUses: 5, // ✓ Anthropic-specific options
        allowedDomains: ["wikipedia.org"]
    },
    systemPrompt: "You are a helpful assistant"
    // reasoning: { ... } // ✗ TypeScript would error - this is OpenAI-only
});

// ❌ Without NodeBuilder, type safety is weaker:
const weaklyTyped = new TextNode({
    promptTemplate: "Test",
    llmConfig: {
        provider: "openai",
        model: "gpt-4",
        // This compiles but shouldn't - mixing features:
        thinking: { type: "enabled", budget_tokens: 1024 }, // Anthropic feature!
        reasoning: { effort: "high" } // OpenAI feature
    }
});

console.log("Examples of type-safe vs weakly typed node creation");

// To demonstrate the type checking:
async function demo() {
    // The NodeBuilder ensures you can't mix provider features
    const result1 = await openaiNode.execute({ topic: "TypeScript" });
    const result2 = await anthropicNode.execute({ topic: "Type Safety" });
    
    console.log("OpenAI result:", result1);
    console.log("Anthropic result:", result2);
}

// Note: This won't actually run without API keys
// demo().catch(console.error);