import { Injectable } from '@nestjs/common';
import { RetrievalService } from './retrieval/retrieval.service';
import { LlmService } from 'src/llm/llm.service';

@Injectable()
export class RagService {
    constructor(
        private readonly retrieval: RetrievalService,
        private readonly llm: LlmService
    ){}

    async ask(question: string) {
        const results: any = await this.retrieval.search(question, 5);
        const relevant = results.filter(
            chunk => chunk.similarity > 0.7
        );

        const context = relevant.map(chunk => chunk.content).join('\n\n');

        return this.llm.generate(context, question);
    }
}
