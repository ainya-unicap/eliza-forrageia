import Groq from "groq-sdk";
import { Message } from "./message.interface";

export class GroqRepository {
    private groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
    constructor() {}

    async get(messages: Message[]) {
        const response = await this.groq.chat.completions.create({
            messages: messages as any,
            model: "openai/gpt-oss-20b"
        });

        const content = response.choices[0]?.message?.content;

        if (content === null || content === undefined) {
            throw new Error('LLM não retornou conteúdo.');
        }

        return content;
    }
}