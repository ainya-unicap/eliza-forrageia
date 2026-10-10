import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Embedding } from 'groq-sdk/resources';

@Injectable()
export class EmbeddingService {
    private readonly ai: GoogleGenAI;
    private readonly model = 'gemini-embedding-2';
    private readonly dimensions = 768;

    constructor() {
        const apikey = process.env.GEMINI_API_KEY;

        if (!apikey) {
            throw new Error('GEMINI_API_KEY não definido no arquivo .env');
        }

        this.ai = new GoogleGenAI({ apiKey: apikey });
    }

    async embedDocument(
        content: string,
        title = 'none'
    ): Promise<number[]> {
        return this.generate(`title: ${title} | text: ${content}`);
    }

    async embedQuery(query: string): Promise<number[]> {
        return this.generate(`task: search result | query: ${query}`);
    }

    async generate(input: string): Promise<number[]> {
        try {
            const response = await this.ai.models.embedContent({
                model: this.model,
                contents: input,
                config: {
                    outputDimensionality: this.dimensions,
                }
            });

            const embedding = response.embeddings?.[0]?.values;

            if (!embedding || embedding.length !== this.dimensions) {
                throw new Error(`Embedding inválido ou dimensões incorretas. Esperado: ${this.dimensions}, Recebido: ${embedding?.length}`);
            }

            return embedding;
        } catch (error: any) {
            throw new Error(`Erro ao gerar embedding: ${error.message}`);
        }
    }
}