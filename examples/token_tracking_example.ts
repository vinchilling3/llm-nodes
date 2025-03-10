import { TextNode } from "../src/index";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default async function main() {
    const textGenerator = new TextNode<{
        format: string;
        topic: string;
        style: string;
        minWords: number;
        maxWords: number;
    }>({
        promptTemplate:
            "Write a {{format}} about {{topic}} in {{style}} style with {{minWords}} to {{maxWords}} words.",
        llmConfig: {
            provider: "openai",
            model: "gpt-3.5-turbo",
        },
    });

    // Use it
    try {
        const text = await textGenerator.execute({
            format: "sonnet",
            topic: "ai",
            style: "doom",
            minWords: 10,
            maxWords: 150,
        });
        console.log("GENERATED TEXT:");
        console.log(text);
    } catch (err) {
        console.error("Error executing node:", err);
    }
    
    // Display token usage statistics
    console.log("\nToken Usage Statistics:");
    console.log("-----------------------");
    const usage = textGenerator.getTotalTokenUsage();
    console.log(`Input Tokens: ${usage.inputTokens}`);
    console.log(`Output Tokens: ${usage.outputTokens}`);
    console.log(`Total Tokens: ${usage.totalTokens}`);
    
    // Show detailed usage records
    console.log("\nDetailed Usage Records:");
    console.log("--------------------------");
    const records = textGenerator.getUsageRecords();
    records.forEach((record, i) => {
        console.log(`Record #${i+1}:`);
        console.log(`  Timestamp: ${record.timestamp}`);
        console.log(`  Provider: ${record.provider}`);
        console.log(`  Model: ${record.model}`);
        console.log(`  Input Tokens: ${record.tokenUsage.inputTokens}`);
        console.log(`  Output Tokens: ${record.tokenUsage.outputTokens}`);
        console.log(`  Total Tokens: ${record.tokenUsage.inputTokens + record.tokenUsage.outputTokens}`);
    });
}