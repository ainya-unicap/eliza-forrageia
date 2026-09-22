import { Injectable } from '@nestjs/common';
import { GroqRepository } from './groq/groqRepository';

@Injectable()
export class LlmService {
    groqRepository = new GroqRepository();
    constructor() {}

    async generate(system: string, user: string) {
        const response = await this.groqRepository.get([
            { role: 'system', content: system },
            { role: 'user', content: user }
        ])

        return response;
    }
}
