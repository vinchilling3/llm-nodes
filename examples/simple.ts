import {
    IExecutable,
    LLMNode,
    jsonParser,
    textParser,
    LLMConfig,
    getApiKeyEnvVar,
} from "../src";

/**
 * Example with OpenAI
 */
const openaiExtractorNode = new LLMNode<
    { text: string },
    { summary: string; keywords: string[] }
>({
    promptTemplate: `
    Extract the key information from the following text:
    {{text}}
    
    Provide your answer as a JSON object with these fields:
    - summary: A brief summary of the content
    - keywords: An array of important keywords from the text
  `,
    llmConfig: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        temperature: 0.3,
        providerOptions: {
            systemPrompt: "You are a helpful assistant that extracts key information from text.",
        },
    },
    parser: jsonParser<{ summary: string; keywords: string[] }>(),
});

/**
 * Example with Claude
 */
const claudeGeneratorNode = new LLMNode<
    { summary: string; keywords: string[] },
    string
>({
    promptTemplate: `
    Write an engaging blog post based on this summary:
    {{summary}}
    
    The blog post should include these keywords: {{keywords.join(', ')}}
  `,
    llmConfig: {
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        temperature: 0.7,
        providerOptions: {
            systemPrompt: "You are a professional content writer who creates engaging blog posts.",
        },
    },
    parser: textParser(),
});

/**
 * Example with Mistral
 */
const mistralSummarizerNode = new LLMNode<
    { text: string },
    { mainPoints: string[] }
>({
    promptTemplate: `
    Summarize the main points from the following text:
    {{text}}
    
    Provide your answer as a JSON object with this field:
    - mainPoints: An array of the key points from the text
  `,
    llmConfig: {
        provider: "mistral",
        model: "mistral-small",
        temperature: 0.2,
        providerOptions: {
            systemPrompt: "You are an expert summarizer who extracts key points.",
        },
    },
    parser: jsonParser<{ mainPoints: string[] }>(),
});

/**
 * Example pipeline with mixed providers
 */
const mixedProviderPipeline: IExecutable<{ text: string }, string> =
    openaiExtractorNode.pipe(claudeGeneratorNode);

/**
 * Helper to check environment variables
 */
function checkEnvironment(config: LLMConfig): void {
    const envVar = getApiKeyEnvVar(config.provider);
    if (!process.env[envVar]) {
        console.warn(`Warning: ${envVar} environment variable not set.`);
        console.warn(
            `You need to set this for ${config.provider} to work properly.`
        );
    }
}

/**
 * Run the pipeline with appropriate environment checks
 */
async function processBlogPost(text: string) {
    // Check if API keys are set
    checkEnvironment(openaiExtractorNode["llmConfig"]);
    checkEnvironment(claudeGeneratorNode["llmConfig"]);

    // Execute the pipeline
    try {
        console.log(
            "Processing with mixed provider pipeline (OpenAI → Claude)..."
        );
        const blogPost = await mixedProviderPipeline.execute({ text });
        console.log("Result:", blogPost);
        return blogPost;
    } catch (error) {
        console.error("Error processing blog post:", error);
        throw error;
    }
}

// Example with Mistral
async function processSummaryWithMistral(text: string) {
    checkEnvironment(mistralSummarizerNode["llmConfig"]);

    try {
        console.log("Processing with Mistral...");
        const summary = await mistralSummarizerNode.execute({ text });
        console.log("Main points:", summary.mainPoints);
        return summary;
    } catch (error) {
        console.error("Error generating summary with Mistral:", error);
        throw error;
    }
}

// Example text
const text = `
  Artificial intelligence has seen tremendous growth in recent years. 
  Large language models like GPT-4 can now generate human-like text, 
  translate languages, write different kinds of creative content, and 
  answer questions in an informative way. However, these models also 
  raise concerns about misinformation, bias, and privacy.
`;

// Uncomment to run:
// processBlogPost(text).catch(console.error);
// processSummaryWithMistral(text).catch(console.error);
