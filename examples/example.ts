import { TextNode } from "../src/index";

export default async function main() {
    const textGenerator = new TextNode<{
        format: string;
        topic: string;
        style: string;
        minWords: number;
        maxWords: number;
    }>({
        promptTemplate:
            "Write a {{format}} about {{topic}} in {{style}} style with {{minWords}} to {{maxWords}} words.",
        llmConfig: {
            provider: "anthropic",
            // model: "claude-3-7-sonnet-20250219",
            model: "claude-3-5-sonnet-20241022",
        },
    });

    // Use it
    const text = await textGenerator.execute({
        format: "sonnet",
        topic: "ai",
        style: "doom",
        minWords: 10,
        maxWords: 150,
    });
    console.log(text);
}
