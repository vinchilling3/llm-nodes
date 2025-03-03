# llm-nodes

A lightweight, composable TypeScript library for working with LLMs that extends LangChain with a simpler, more intuitive API.

## Installation

```bash
npm install llm-nodes
```

## Features

- **Simplified Node Pattern**: Combines prompt templates, LLM configuration, and response parsing into a cohesive unit
- **Type-Safe**: Full TypeScript support with generics for input and output types
- **Composable**: Easily connect nodes using functional composition
- **LangChain Compatible**: Built on top of LangChain for compatibility with its ecosystem
- **Lightweight**: Minimal API with sensible defaults for rapid development
- **Multi-Provider Support**: Works with OpenAI, Anthropic (Claude), Mistral, Grok, Cohere, Ollama, and other LLM providers
- **Mix and Match**: Create pipelines that use different providers for different steps

## Quick Start

```typescript
import { LLMNode, jsonParser } from 'llm-nodes';

// Create a simple node for sentiment analysis
const sentimentAnalyzer = new LLMNode<{ text: string }, { sentiment: string, score: number }>({
  promptTemplate: `
    Analyze the sentiment of the following text:
    {{text}}
    
    Respond with a JSON object containing:
    - sentiment: either "positive", "negative", or "neutral"
    - score: a number from -1 (very negative) to 1 (very positive)
  `,
  llmConfig: {
    provider: "openai",           // Specify the provider
    model: "gpt-3.5-turbo",
    temperature: 0.3
  },
  parser: jsonParser<{ sentiment: string, score: number }>()
});

// Use the node
async function analyzeSentiment(text: string) {
  const result = await sentimentAnalyzer.execute({ text });
  console.log(result); // { sentiment: "positive", score: 0.8 }
  return result;
}

analyzeSentiment("I'm having a fantastic day today!");
```

### Multiple Provider Example

```typescript
import { LLMNode, textParser } from 'llm-nodes';

// Create a node using Claude for creative writing
const claudeWriter = new LLMNode<{ topic: string, style: string }, string>({
  promptTemplate: `
    Write a short story about {{topic}} in the style of {{style}}.
  `,
  llmConfig: {
    provider: "anthropic",        // Use Anthropic's Claude
    model: "claude-3-haiku-20240307",
    temperature: 0.7,
    systemPrompt: "You are a creative writer who specializes in short stories."
  },
  parser: textParser()
});

// Create a node using Mistral for summarization
const mistralSummarizer = new LLMNode<{ text: string }, { summary: string }>({
  promptTemplate: `
    Summarize the following text in a concise way:
    {{text}}
    
    Respond with a JSON object containing:
    - summary: your concise summary
  `,
  llmConfig: {
    provider: "mistral",          // Use Mistral AI
    model: "mistral-small",
    temperature: 0.3,
    systemPrompt: "You are an expert summarizer."
  },
  parser: jsonParser<{ summary: string }>()
});

// Use nodes with different providers in the same application
async function generateAndSummarize(topic: string, style: string) {
  const story = await claudeWriter.execute({ topic, style });
  const { summary } = await mistralSummarizer.execute({ text: story });
  
  return { story, summary };
}
```

## Advanced Usage: Node Composition with Different Providers

```typescript
// Create information extraction node with OpenAI
const infoExtractor = new LLMNode<{ article: string }, { topics: string[], summary: string }>({
  promptTemplate: `
    Extract key information from this article:
    {{article}}
    
    Provide a JSON with:
    - topics: an array of main topics
    - summary: a concise summary
  `,
  llmConfig: { 
    provider: "openai",
    model: "gpt-3.5-turbo"
  },
  parser: jsonParser<{ topics: string[], summary: string }>()
});

// Create a blog post generator node with Claude
const blogWriter = new LLMNode<{ topics: string[], summary: string }, string>({
  promptTemplate: `
    Write a blog post based on:
    Summary: {{summary}}
    Topics: {{topics.join(', ')}}
  `,
  llmConfig: { 
    provider: "anthropic",
    model: "claude-3-sonnet-20240229", 
    temperature: 0.7 
  },
  parser: (text) => text // Simple text parser
});

// Create headline generator with Mistral
const headlineGenerator = new LLMNode<{ blogPost: string }, { headlines: string[] }>({
  promptTemplate: `
    Generate 5 compelling headlines for this blog post:
    {{blogPost}}
    
    Return a JSON with an array of headlines.
  `,
  llmConfig: {
    provider: "mistral",
    model: "mistral-medium",
    temperature: 0.9
  },
  parser: jsonParser<{ headlines: string[] }>()
});

// Create a pipeline by connecting nodes from different providers
const articleToHeadlinesPipeline = infoExtractor
  .pipe(blogWriter)
  .pipe({
    execute: async (blogPost) => {
      const { headlines } = await headlineGenerator.execute({ blogPost });
      return { blogPost, headlines };
    }
  });

// Use the multi-provider pipeline
const result = await articleToHeadlinesPipeline.execute({ 
  article: "Your article text here..." 
});
```

## API Reference

### `LLMNode<TInput, TOutput>`

The core class that encapsulates an LLM interaction pattern.

#### Constructor Options

```typescript
{
  promptTemplate: string | ((input: TInput) => string);
  llmConfig: {
    provider: 'openai' | 'anthropic' | 'mistral' | 'grok' | 'cohere' | 'ollama' | string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    // Provider-specific options
    // See provider-specific configs below
  };
  parser: (rawResponse: string) => TOutput;
}
```

#### Methods

- `execute(input: TInput): Promise<TOutput>` - Execute the node with input data
- `pipe<TNextOutput>(nextNode: IExecutable<TOutput, TNextOutput>): IExecutable<TInput, TNextOutput>` - Connect to another node

### LLM Provider Configurations

#### OpenAI Configuration

```typescript
{
  provider: 'openai',
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo' | string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  // OpenAI-specific options
  apiKey?: string,              // Default: process.env.OPENAI_API_KEY
  organization?: string,        // Default: process.env.OPENAI_ORGANIZATION
  frequencyPenalty?: number,
  presencePenalty?: number,
  topP?: number,
}
```

#### Anthropic (Claude) Configuration

```typescript
{
  provider: 'anthropic',
  model: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  // Anthropic-specific options
  apiKey?: string,              // Default: process.env.ANTHROPIC_API_KEY
  topK?: number,
  topP?: number,
  maxTokensToSample?: number,
}
```

#### Mistral Configuration

```typescript
{
  provider: 'mistral',
  model: 'mistral-small' | 'mistral-medium' | 'mistral-large' | string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  // Mistral-specific options
  apiKey?: string,              // Default: process.env.MISTRAL_API_KEY
  topP?: number,
  safeMode?: boolean,
  randomSeed?: number,
}
```

#### Grok Configuration

```typescript
{
  provider: 'grok',
  model: 'grok-1' | string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  // Grok-specific options
  apiKey?: string,              // Default: process.env.GROK_API_KEY
  topP?: number,
}
```

#### Ollama Configuration

```typescript
{
  provider: 'ollama',
  model: 'llama3' | 'mistral' | 'codellama' | string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  // Ollama-specific options
  baseUrl?: string,             // Default: http://localhost:11434
  format?: string,
  keepAlive?: string,
  numKeep?: number,
}
```

### Utility Functions

- `createModel(config: LLMConfig): BaseChatModel` - Create a LangChain model instance from config
- `getApiKeyEnvVar(provider: string): string` - Get the environment variable name for a provider's API key
- `supportsSystemMessages(provider: string): boolean` - Check if a provider natively supports system messages

### Type Guards

- `isOpenAIConfig(config: LLMConfig): config is OpenAIConfig`
- `isAnthropicConfig(config: LLMConfig): config is AnthropicConfig`
- `isMistralConfig(config: LLMConfig): config is MistralConfig`
- `isGrokConfig(config: LLMConfig): config is GrokConfig`
- `isCohereConfig(config: LLMConfig): config is CohereConfig`
- `isOllamaConfig(config: LLMConfig): config is OllamaConfig`

### Parsers

- `jsonParser<T>()` - Parse JSON responses
- `jsonFieldParser<T>(field: string)` - Extract a specific field from JSON
- `regexParser<T>(patterns: Record<keyof T, RegExp>)` - Extract data using regex patterns
- `labeledFieldsParser<T>()` - Parse responses with labeled fields
- `textParser()` - Return raw text responses

## License

MIT