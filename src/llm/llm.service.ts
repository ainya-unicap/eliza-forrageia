import { Injectable } from '@nestjs/common';
import { GroqRepository } from './groq/groqRepository';
import { Message } from './groq/message.interface';
import {
  LlmToolExecutionContext,
  ToolRegistryService,
} from './tool-registry.service';

@Injectable()
export class LlmService {
  constructor(
    private readonly toolRegistry: ToolRegistryService,
    private readonly groqRepository: GroqRepository,
  ) {}

  async generate(system: string, user: string) {
    return this.generateWithTools(system, user);
  }

  async generateWithTools(
    system: string,
    user: string,
    maxToolRounds = 2,
    toolContext?: LlmToolExecutionContext,
  ) {
    const messages: Message[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
    const knowledgeReferences = new Set<string>();

    let response = await this.groqRepository.get(messages, {
      tools: this.toolRegistry.getTools(toolContext),
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
            return await this.toolRegistry.execute(toolCall, toolContext);
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

      if (toolContext?.includeKnowledgeReferences) {
        for (const result of toolResults) {
          if (result.name !== 'search_knowledge_base' || !result.content) {
            continue;
          }

          try {
            const searchResults: unknown = JSON.parse(result.content);
            if (!Array.isArray(searchResults)) {
              continue;
            }

            for (const item of searchResults) {
              if (
                typeof item === 'object' &&
                item !== null &&
                'documentName' in item &&
                typeof item.documentName === 'string' &&
                item.documentName.trim()
              ) {
                knowledgeReferences.add(
                  item.documentName.replace(/[\r\n]+/gu, ' ').trim(),
                );
              }
            }
          } catch {
            // Tool errors are returned to the model and are not citations.
          }
        }
      }

      messages.push(...toolResults);

      response = await this.groqRepository.get(messages, {
        tools: this.toolRegistry.getTools(toolContext),
        tool_choice: 'auto',
      });

      rounds += 1;
    }

    const answer = response.content ?? '';

    if (!toolContext?.includeKnowledgeReferences) {
      return answer;
    }

    const references = [...knowledgeReferences]
      .map((name) => `- ${name}`)
      .join('\n');

    return `${answer}\n\n# Referências\n${
      references || 'Nenhum documento relevante foi recuperado da base documental.'
    }`;
  }
}
