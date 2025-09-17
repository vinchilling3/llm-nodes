import { GoogleGenAI } from "@google/genai";
import { ILLMProvider, LLMResponse } from "./ILLMProvider";
import { GoogleGenAIProviderConfig } from "../types";

interface InvokeConfig {
  model?: string;
  maxTokens?: number;
  thinking?: {
    type: "enabled" | "disabled";
    budget_tokens?: number;
  };
}

export class GoogleGenAIProvider implements ILLMProvider {
  readonly provider = "genai";
  private client: GoogleGenAI;
  private model: string;

  constructor(config: GoogleGenAIProviderConfig) {
    this.model = config.model;
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async invoke(
    prompt: string,
    config: InvokeConfig = {}
  ): Promise<LLMResponse> {
    const model = config.model ?? this.model;
    const maxTokens = config.maxTokens ?? 3000;
    const thinkingBudget =
      config.thinking?.type === "enabled"
        ? config.thinking.budget_tokens ?? 0
        : 0;

    // Convert string prompt into Gemini SDK format
    const contents = [{ parts: [{ text: prompt }] }];

    const response = await this.client.models.generateContent({
      model,
      contents,
      config: {
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingBudget },
      },
    });

    return {
      content: response.text ?? "",
      thinking: config.thinking as any,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        thinkingTokens: thinkingBudget,
        searchCount: 0,
      },
      raw: response,
    };
  }
}
