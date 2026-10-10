import { Injectable } from '@nestjs/common';
import { GroqRepository } from './groq/groqRepository';
import { Message } from './groq/message.interface';
import { ToolRegistryService } from './tool-registry.service';

@Injectable()
export class LlmService {
    constructor(
        private readonly toolRegistry: ToolRegistryService,
        private readonly groqRepository: GroqRepository,
    ) {}

    async generate(system: string, user: string) {
        return this.generateWithTools(system, user);
    }

    async generateWithTools(system: string, user: string, maxToolRounds = 2) {
        const messages: Message[] = [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ];

        let response = await this.groqRepository.get(messages, {
            tools: this.toolRegistry.getTools(),
            tool_choice: 'auto',
        });

        let rounds = 0;

        while (response.tool_calls?.length && rounds < maxToolRounds) {
            messages.push({
                role: 'assistant',
                content: response.content,
                tool_calls: response.tool_calls,
            });

            const toolResults: Message[] = await Promise.all(
                response.tool_calls.map(async (toolCall) => {
                    try {
                        return await this.toolRegistry.execute(toolCall);
                    } catch (error) {
                        return {
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                            content: JSON.stringify({
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : 'Ferramenta falhou ao ser executada.',
                            }),
                        } satisfies Message;
                    }
                }),
            );

            messages.push(...toolResults);

            response = await this.groqRepository.get(messages, {
                tools: this.toolRegistry.getTools(),
                tool_choice: 'auto',
            });

            rounds += 1;
        }

        return response.content ?? '';
    }
}
