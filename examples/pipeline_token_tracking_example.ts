import { TextNode, DataEnricherNode } from "../src/index";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default async function main() {
    // Create a DataEnricherNode to add user preferences
    const enricher = new DataEnricherNode<
        { query: string },
        { query: string, preferences: { style: string, wordLimit: number } }
    >({
        context: { 
            style: "doom", 
            wordLimit: 100
        },
        enricher: (input, context) => ({
            query: input.query,
            preferences: context
        })
    });

    // Create a text generation node
    const textGenerator = new TextNode<{
        query: string,
        preferences: { style: string, wordLimit: number }
    }>({
        promptTemplate: "Write about {{query}} in {{preferences.style}} style with {{preferences.wordLimit}} words.",
        llmConfig: {
            provider: "openai",
            model: "gpt-3.5-turbo",
        },
    });

    // Chain the nodes together with token usage tracking
    const pipeline = enricher.pipe(textGenerator);

    // Execute the pipeline
    try {
        const result = await pipeline.execute({
            query: "artificial intelligence"
        });
        
        console.log("GENERATED TEXT:");
        console.log(result);
    } catch (err) {
        console.error("Error executing pipeline:", err);
    }
    
    // Display token usage statistics for the entire pipeline
    console.log("\nPipeline Token Usage Statistics:");
    console.log("-------------------------------");
    const usage = pipeline.getTotalTokenUsage();
    console.log(`Input Tokens: ${usage.inputTokens}`);
    console.log(`Output Tokens: ${usage.outputTokens}`);
    console.log(`Total Tokens: ${usage.totalTokens}`);
    
    // Show all usage records from the pipeline
    console.log("\nAll Pipeline Usage Records:");
    console.log("-----------------------------");
    const records = pipeline.getUsageRecords();
    records.forEach((record, i) => {
        console.log(`Record #${i+1}:`);
        console.log(`  Provider: ${record.provider}`);
        console.log(`  Model: ${record.model}`);
        console.log(`  Total Tokens: ${record.tokenUsage.inputTokens + record.tokenUsage.outputTokens}`);
    });
}