import Groq from 'groq-sdk';
import { Message } from './message.interface';

export interface GroqRequestOptions {
    tools?: any[];
    tool_choice?: 'auto' | 'none';
}

export class GroqRepository {
    private readonly groq: Groq;

    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }

    async get(messages: Message[], options: GroqRequestOptions = {}) {
        const request = {
            messages: messages as any,
            model: 'openai/gpt-oss-20b',
            ...(options.tools && options.tools.length > 0
                ? {
                      tools: options.tools,
                      tool_choice: options.tool_choice ?? 'auto',
                  }
                : {}),
        };

        const response = await this.groq.chat.completions.create(request as any);
        const message = response.choices[0]?.message;

        if (!message) {
            throw new Error('LLM não retornou uma resposta válida.');
        }

        return message;
    }
}