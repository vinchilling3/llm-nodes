import { LLMNode, jsonParser, textParser } from './src';

// Define a node that extracts key information from a text
const informationExtractorNode = new LLMNode<{ text: string }, { summary: string, keywords: string[] }>({
  promptTemplate: `
    Extract the key information from the following text:
    {{text}}
    
    Provide your answer as a JSON object with these fields:
    - summary: A brief summary of the content
    - keywords: An array of important keywords from the text
  `,
  llmConfig: {
    model: "gpt-3.5-turbo",
    temperature: 0.3,
    systemPrompt: "You are a helpful assistant that extracts key information from text."
  },
  parser: jsonParser<{ summary: string, keywords: string[] }>()
});

// Define a node that generates a blog post from extracted information
const blogPostGeneratorNode = new LLMNode<{ summary: string, keywords: string[] }, string>({
  promptTemplate: `
    Write an engaging blog post based on this summary:
    {{summary}}
    
    The blog post should include these keywords: {{keywords.join(', ')}}
  `,
  llmConfig: {
    model: "gpt-4",
    temperature: 0.7,
    systemPrompt: "You are a professional content writer who creates engaging blog posts."
  },
  parser: textParser()
});

// Create a pipeline by connecting the nodes
const textToBlogPostPipeline = informationExtractorNode.pipe(blogPostGeneratorNode);

// Use the pipeline
async function processBlogPost(text: string) {
  const blogPost = await textToBlogPostPipeline.execute({ text });
  console.log(blogPost);
  return blogPost;
}

// Example usage
const text = `
  Artificial intelligence has seen tremendous growth in recent years. 
  Large language models like GPT-4 can now generate human-like text, 
  translate languages, write different kinds of creative content, and 
  answer questions in an informative way. However, these models also 
  raise concerns about misinformation, bias, and privacy.
`;

// Uncomment to run:
// processBlogPost(text).catch(console.error);
