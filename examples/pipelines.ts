/**
 * Advanced Pipeline Examples
 *
 * This file demonstrates various pipeline patterns possible with llm-nodes.
 */

import {
    LLMNode,
    ClassificationNode,
    ExtractionNode,
    DataEnricherNode,
    MergeNode,
    jsonParser,
} from "../src";

// Simple linear pipeline with pipe()
function simplePipeline() {
    const textClassifier = new ClassificationNode({
        categories: [
            "business",
            "technology",
            "health",
            "entertainment",
        ] as const,
        llmConfig: { model: "gpt-3.5-turbo", provider: "openai" },
    });

    const contentGenerator = new LLMNode({
        promptTemplate:
            "Generate a short article about {{topic}} in the {{category}} category.",
        llmConfig: { model: "gpt-4", provider: "openai" },
        parser: (text) => text,
    });

    // Linear pipeline
    const pipeline = textClassifier.pipe(contentGenerator);

    // Usage
    async function generateContent(text: string) {
        return pipeline.execute({ text, topic: "AI advancements" });
    }
}

// Pipeline with external data injection using DataEnricherNode
function dataEnrichmentPipeline() {
    // Node to extract key points from an article
    const keyPointExtractor = new ExtractionNode({
        fields: [
            { name: "mainTopic", description: "The main topic of the article" },
            { name: "keyPoints", description: "Key points from the article" },
        ],
        promptTemplate: "Extract key information from: {{text}}",
        llmConfig: { model: "gpt-3.5-turbo", provider: "openai" },
    });

    // External data source - could be from a database, API, etc.
    const getSiteMap = async () => {
        return {
            relatedArticles: [
                { title: "AI in Healthcare", url: "/ai-healthcare" },
                { title: "Future of Work", url: "/future-work" },
            ],
        };
    };

    // Node to enrich the extracted data with site map
    const siteMapEnricher = new DataEnricherNode({
        // Combine extracted data with site map
        enricher: (extractionResult, context) => ({
            extraction: extractionResult,
            siteMap: context,
        }),
        // Function to fetch site map
        context: getSiteMap,
    });

    // Node to generate article with internal links
    const articleFormatter = new LLMNode({
        promptTemplate: `
        Create an article based on the following key points:
        {{extraction.data.keyPoints}}
        
        Include these internal links where relevant:
        {{siteMap.relatedArticles.map(a => a.title + ': ' + a.url).join('\n')}}
      `,
        llmConfig: { model: "gpt-4", provider: "openai" },
        parser: (text) => text,
    });

    // Connect the pipeline
    const pipeline = keyPointExtractor
        .pipe(siteMapEnricher)
        .pipe(articleFormatter);

    // Usage
    async function generateArticleWithLinks(text: string) {
        return pipeline.execute({ text });
    }
}

// Multiple inputs pipeline with MergeNode
function multiInputPipeline() {
    // Node to summarize text
    const summaryNode = new LLMNode({
        promptTemplate: "Summarize the following text: {{text}}",
        llmConfig: { model: "gpt-3.5-turbo", provider: "openai" },
        parser: (text) => ({ summary: text }),
    });

    // Node to extract key points
    const keyPointsNode = new LLMNode({
        promptTemplate: "Extract the key points from: {{text}}",
        llmConfig: { model: "gpt-3.5-turbo", provider: "openai" },
        parser: jsonParser<{ keyPoints: string[] }>(),
    });

    // Node to merge results
    const mergeNode = new MergeNode({
        merger: (inputs) => {
            const [summaryResult, keyPointsResult] = inputs;
            return {
                summary: summaryResult.summary,
                keyPoints: keyPointsResult.keyPoints,
            };
        },
    });

    // Node to create final newsletter
    const newsletterNode = new LLMNode({
        promptTemplate: `
        Create a newsletter with this summary:
        {{summary}}
        
        And these key points:
        {{keyPoints.join('\n')}}
      `,
        llmConfig: { model: "gpt-4", provider: "openai" },
        parser: (text) => text,
    });

    // Usage with manual execution
    async function createNewsletter(text: string) {
        // Run parallel processes
        const [summaryResult, keyPointsResult] = await Promise.all([
            summaryNode.execute({ text }),
            keyPointsNode.execute({ text }),
        ]);

        // Merge results
        const mergedResult = await mergeNode.execute([
            summaryResult,
            keyPointsResult,
        ]);

        // Generate newsletter
        return newsletterNode.execute(mergedResult);
    }

    // Alternative using the helper method
    const parallelPipeline = MergeNode.createPipeline(
        [summaryNode, keyPointsNode],
        mergeNode
    );

    async function createNewsletterSimplified(text: string) {
        const mergedResult = await parallelPipeline({ text });
        return newsletterNode.execute(mergedResult);
    }
}

// Custom pipeline with direct execute calls for maximum flexibility
function customPipeline() {
    const analyzer = new LLMNode({
        promptTemplate: "Analyze the tone and content of: {{text}}",
        llmConfig: { model: "gpt-3.5-turbo", provider: "openai" },
        parser: jsonParser(),
    });

    const generator = new LLMNode({
        promptTemplate: "Generate content about {{topic}} with tone: {{tone}}",
        llmConfig: { model: "gpt-4", provider: "openai" },
        parser: (text) => text,
    });

    // Custom pipeline with manual control flow
    async function complexWorkflow(text: string, userPreferences: any) {
        // First analysis
        const analysis = await analyzer.execute({ text });

        // Custom business logic
        const finalTone = userPreferences.overrideTone || analysis.tone;

        // Optional processing based on conditions
        if (
            analysis.sentiment === "negative" &&
            !userPreferences.allowNegative
        ) {
            throw new Error("Negative content detected");
        }

        // External data integration
        const userData = await fetchUserData(userPreferences.userId);

        // Final generation with custom combined context
        return generator.execute({
            topic: analysis.mainTopic,
            tone: finalTone,
            userName: userData.name,
        });
    }

    async function fetchUserData(userId: string) {
        // Simulate external data fetch
        return { name: "Example User" };
    }
}
