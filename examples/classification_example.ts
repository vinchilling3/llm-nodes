import { ClassificationNode } from "../src/nodes/ClassificationNode";

// Example 1: Simple sentiment analysis
async function sentimentAnalysis() {
  console.log("--- Sentiment Analysis Example ---");
  
  // Define the categories for sentiment analysis
  type SentimentCategory = "Positive" | "Negative" | "Neutral";
  
  // Create a classification node for sentiment analysis
  const sentimentClassifier = new ClassificationNode<string, SentimentCategory>({
    categories: ["Positive", "Negative", "Neutral"],
    llmConfig: {
      provider: "openai", // Specify the provider
      model: "gpt-3.5-turbo", // Replace with your model of choice
      apiKey: process.env.OPENAI_API_KEY || "", // Make sure to set your API key
      temperature: 0.1
    },
    includeExplanation: true
  });
  
  // Run classification on different texts
  const positiveText = "I'm having a wonderful day! Everything is going great.";
  const negativeText = "This product is terrible. I regret buying it.";
  const neutralText = "The weather today is partly cloudy with a temperature of 72 degrees.";
  
  const positiveResult = await sentimentClassifier.execute(positiveText);
  const negativeResult = await sentimentClassifier.execute(negativeText);
  const neutralResult = await sentimentClassifier.execute(neutralText);
  
  console.log("Positive text result:", positiveResult);
  console.log("Negative text result:", negativeResult);
  console.log("Neutral text result:", neutralResult);
}

// Example 2: Content moderation with custom prompt
async function contentModeration() {
  console.log("\n--- Content Moderation Example ---");
  
  type ContentCategory = "Safe" | "Unsafe" | "NeedsReview";
  
  // Create a classification node with a custom prompt
  const moderationClassifier = new ClassificationNode<{content: string}, ContentCategory>({
    categories: ["Safe", "Unsafe", "NeedsReview"],
    promptTemplate: `Moderate the following content and determine if it's appropriate.
Be decisive in your classification:
- "Safe": Content that is appropriate and doesn't contain concerning material
- "Unsafe": Content that contains harmful, illegal, or inappropriate material
- "NeedsReview": ONLY use when genuinely unable to determine if content is safe or unsafe

Content to moderate:
{{input}}`,
    llmConfig: {
      provider: "openai", // Specify the provider
      model: "gpt-3.5-turbo", // Replace with your model of choice
      apiKey: process.env.OPENAI_API_KEY || "",
      temperature: 0.1, // Lower temperature for more decisive results
    },
    includeExplanation: true,
    defaultPrompt: false // Use our custom prompt instead of the default
  });
  
  // Run classification on different content
  const safeContent = { 
    content: "This app helps users organize their tasks and manage their time efficiently."
  };
  const unsafeContent = { 
    content: "Here's how to hack into someone's account without their permission and steal their personal information. This guide also includes instructions for illegal activities."
  };
  const reviewContent = { 
    content: "The video contains mild profanity and some suggestive content that may not be suitable for all audiences. While not explicitly unsafe, it requires review to determine appropriate age ratings."
  };
  
  const safeResult = await moderationClassifier.execute(safeContent);
  const unsafeResult = await moderationClassifier.execute(unsafeContent);
  const reviewResult = await moderationClassifier.execute(reviewContent);
  
  console.log("Safe content result:", safeResult);
  console.log("Unsafe content result:", unsafeResult);
  console.log("Content needing review result:", reviewResult);
}

// Run the examples
async function runExamples() {
  try {
    // Only run content moderation for debugging
    await contentModeration();
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Check if this file is being run directly
if (require.main === module) {
  runExamples();
}