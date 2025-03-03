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

## Advanced Usage: Node Composition

```typescript
// Create information extraction node
const infoExtractor = new LLMNode<{ article: string }, { topics: string[], summary: string }>({
  promptTemplate: `
    Extract key information from this article:
    {{article}}
    
    Provide a JSON with:
    - topics: an array of main topics
    - summary: a concise summary
  `,
  llmConfig: { model: "gpt-3.5-turbo" },
  parser: jsonParser<{ topics: string[], summary: string }>()
});

// Create a blog post generator node
const blogWriter = new LLMNode<{ topics: string[], summary: string }, string>({
  promptTemplate: `
    Write a blog post based on:
    Summary: {{summary}}
    Topics: {{topics.join(', ')}}
  `,
  llmConfig: { model: "gpt-4", temperature: 0.7 },
  parser: (text) => text // Simple text parser
});

// Create a pipeline by connecting nodes
const articleToBlogPipeline = infoExtractor.pipe(blogWriter);

// Use the pipeline
const result = await articleToBlogPipeline.execute({ 
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
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    // Additional model-specific options
  };
  parser: (rawResponse: string) => TOutput;
}
```

#### Methods

- `execute(input: TInput): Promise<TOutput>` - Execute the node with input data
- `pipe<TNextOutput>(nextNode: IExecutable<TOutput, TNextOutput>): IExecutable<TInput, TNextOutput>` - Connect to another node

### Parsers

- `jsonParser<T>()` - Parse JSON responses
- `jsonFieldParser<T>(field: string)` - Extract a specific field from JSON
- `regexParser<T>(patterns: Record<keyof T, RegExp>)` - Extract data using regex patterns
- `labeledFieldsParser<T>()` - Parse responses with labeled fields
- `textParser()` - Return raw text responses

## License

MIT