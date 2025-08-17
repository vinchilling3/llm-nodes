import { LLMNode, TextNode, jsonParser } from "../src";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Example 1: OpenAI o3-mini with research mode
async function openAIReasoningExample() {
    console.log("--- OpenAI o3-mini Reasoning Example ---");
    
    // Create a node for complex problem solving with reasoning
    const reasoningNode = new LLMNode<{problem: string}, {solution: string, steps: string[]}>({
        promptTemplate: `Solve this complex problem step by step:
{{problem}}

Provide your solution in JSON format with:
- solution: The final answer
- steps: An array of reasoning steps taken`,
        llmConfig: {
            provider: "openai",
            model: "o3-mini",
            enableResearch: true, // Enable research mode
            reasoning: {
                effort: "high", // Use high effort for complex problems
                summary: "detailed"
            }
        },
        parser: jsonParser<{solution: string, steps: string[]}>()
    });
    
    // Test with a complex problem
    const problem = {
        problem: "A farmer needs to transport a fox, a chicken, and a bag of grain across a river. " +
                 "The boat can only carry the farmer and one item at a time. If left alone, " +
                 "the fox will eat the chicken, and the chicken will eat the grain. " +
                 "How can the farmer transport all three items safely?"
    };
    
    try {
        const result = await reasoningNode.execute(problem);
        console.log("Solution:", result.solution);
        console.log("Steps:");
        result.steps.forEach((step, i) => console.log(`${i + 1}. ${step}`));
        
        // Show token usage including reasoning tokens
        const usage = reasoningNode.getTotalTokenUsage();
        console.log("\nToken Usage:");
        console.log(`  Input: ${usage.inputTokens}`);
        console.log(`  Output: ${usage.outputTokens}`);
        console.log(`  Reasoning: ${usage.researchTokens || 0}`);
        console.log(`  Total: ${usage.totalTokens}`);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Example 2: Anthropic Claude 3.7 with thinking mode
async function anthropicThinkingExample() {
    console.log("\n--- Anthropic Claude 3.7 Thinking Example ---");
    
    // Create a node for analytical thinking
    const thinkingNode = new TextNode({
        promptTemplate: `Analyze the following code and identify potential security vulnerabilities:

\`\`\`python
def login(username, password):
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = db.execute(query)
    if result:
        session['user'] = username
        return "Login successful"
    return "Invalid credentials"
\`\`\`

Provide a detailed analysis of security issues and recommendations.`,
        llmConfig: {
            provider: "anthropic",
            model: "claude-3-7-sonnet-latest",
            enableResearch: true, // Enable thinking mode
            thinking: {
                type: "enabled",
                budget_tokens: 2000 // Allow up to 2000 tokens for thinking
            }
        }
    });
    
    try {
        const analysis = await thinkingNode.execute({});
        console.log("Security Analysis:");
        console.log(analysis);
        
        // Show token usage
        const usage = thinkingNode.getTotalTokenUsage();
        console.log("\nToken Usage:");
        console.log(`  Input: ${usage.inputTokens}`);
        console.log(`  Output: ${usage.outputTokens}`);
        console.log(`  Thinking: ${usage.researchTokens || 0}`);
        console.log(`  Total: ${usage.totalTokens}`);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Example 3: Auto-detection with research mode
async function autoDetectionExample() {
    console.log("\n--- Auto-Detection Example ---");
    
    // The model will be detected as a research model
    const autoNode = new LLMNode<{question: string}, string>({
        promptTemplate: "Answer this question with careful consideration: {{question}}",
        llmConfig: {
            provider: "openai",
            model: "o1-preview", // Research model - will auto-enable features
            enableResearch: true
        },
        parser: (text) => text.trim()
    });
    
    try {
        const answer = await autoNode.execute({
            question: "What are the philosophical implications of artificial general intelligence?"
        });
        console.log("Answer:", answer);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Example 4: Pipeline with research mode
async function pipelineExample() {
    console.log("\n--- Pipeline with Research Mode Example ---");
    
    // First node: Analyze with thinking
    const analyzeNode = new LLMNode<{data: string}, {insights: string[]}>({
        promptTemplate: "Analyze this data and extract key insights: {{data}}",
        llmConfig: {
            provider: "anthropic",
            model: "claude-3-7-sonnet-latest",
            enableResearch: true,
            thinking: {
                type: "enabled",
                budget_tokens: 1500
            }
        },
        parser: jsonParser<{insights: string[]}>()
    });
    
    // Second node: Generate recommendations
    const recommendNode = new LLMNode<{insights: string[]}, string>({
        promptTemplate: `Based on these insights:
{{insights}}

Generate actionable recommendations.`,
        llmConfig: {
            provider: "openai",
            model: "gpt-4", // Regular model without research mode
            temperature: 0.7
        },
        parser: (text) => text
    });
    
    // Create pipeline
    const pipeline = analyzeNode.pipe(recommendNode);
    
    try {
        const result = await pipeline.execute({
            data: "Q3 sales increased 15% YoY, customer retention dropped 5%, " +
                  "new product adoption rate is 23%, support tickets increased 30%"
        });
        
        console.log("Recommendations:", result);
        
        // Show combined token usage
        const usage = pipeline.getTotalTokenUsage();
        console.log("\nTotal Pipeline Token Usage:");
        console.log(`  Input: ${usage.inputTokens}`);
        console.log(`  Output: ${usage.outputTokens}`);
        console.log(`  Research/Thinking: ${usage.researchTokens || 0}`);
        console.log(`  Total: ${usage.totalTokens}`);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Run examples based on command line argument
async function main() {
    const example = process.argv[2];
    
    switch(example) {
        case 'openai':
            await openAIReasoningExample();
            break;
        case 'anthropic':
            await anthropicThinkingExample();
            break;
        case 'auto':
            await autoDetectionExample();
            break;
        case 'pipeline':
            await pipelineExample();
            break;
        default:
            console.log("Usage: npm run example research_mode_example [openai|anthropic|auto|pipeline]");
            console.log("\nNote: Make sure you have the appropriate API keys set:");
            console.log("- OPENAI_API_KEY for OpenAI examples");
            console.log("- ANTHROPIC_API_KEY for Anthropic examples");
            console.log("\nAlso note that o1/o3 models require special access from OpenAI");
    }
}

// Export for use with run_example.ts
export default main;

// Run if called directly
if (require.main === module) {
    main();
}