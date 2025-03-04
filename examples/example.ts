import { TextNode } from "../src/index";

export default async function main() {
    console.log("Running example...");

    const storyGenerator = new TextNode<{
        topic: string;
        style: string;
        minWords: number;
        maxWords: number;
    }>({
        promptTemplate:
            "Write a short story about {{topic}} in {{style}} style with {{minWords}} to {{maxWords}} words.",
        llmConfig: {
            provider: "openai",
            model: "gpt-4",
        },
    });

    // Use it
    const story = await storyGenerator.execute({
        topic: "a robot learning to paint",
        style: "magical realism",
        minWords: 100,
        maxWords: 200,
    });
    console.log(story);
}
