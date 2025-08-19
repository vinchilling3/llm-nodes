// This file verifies that the usage recording types are properly connected
import { LLMNode, TextNode, TokenUsage, UsageRecord } from "../src";

// Verify TokenUsage type includes researchTokens
const tokenUsage: TokenUsage = {
    inputTokens: 100,
    outputTokens: 200,
    researchTokens: 50  // Optional field for research/thinking tokens
};

// Verify UsageRecord structure
const usageRecord: UsageRecord = {
    timestamp: new Date(),
    provider: "openai",
    model: "gpt-4",
    tokenUsage: tokenUsage
};

// Verify methods exist on nodes
const node = new TextNode({
    promptTemplate: "Test",
    llmConfig: {
        provider: "openai",
        model: "gpt-3.5-turbo"
    }
});

// These methods should exist and have correct return types
const records: UsageRecord[] = node.getUsageRecords();
const total: TokenUsage & { totalTokens: number } = node.getTotalTokenUsage();

console.log("✅ Type verification successful!");
console.log("   - TokenUsage includes optional researchTokens field");
console.log("   - UsageRecord properly typed");
console.log("   - Node methods return correct types");
console.log("   - getTotalTokenUsage() includes totalTokens calculation");

export default function() {
    console.log("Types verified successfully");
}