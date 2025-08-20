import { TextNode } from "../src/index";

export default async function main() {
    type TextNodeInput = {
        format: string;
        topic: string;
        style: string;
        minWords: number;
        maxWords: number;
    };

    const textGenerator = new TextNode<TextNodeInput>({
        promptTemplate:
            "Write a {{format}} about {{topic}} in {{style}} style with {{minWords}} to {{maxWords}} words.",
        llmConfig: {
            provider: "anthropic",
            model: "claude-3-7-sonnet-20250219",
            maxTokens: 10000,
        },
    });

    // Use it
    const text = await textGenerator.execute({
        format: "sonnet",
        topic: "ai",
        style: "uplifting",
        minWords: 10,
        maxWords: 150,
    });
    console.log(text);
}
