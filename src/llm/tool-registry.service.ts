import { Injectable } from '@nestjs/common';
import { Message, ToolCall } from './groq/message.interface';
import { RetrievalService } from '../rag/retrieval/retrieval.service';

export interface LlmToolExecutionContext {
  canteiroId?: string;
  accessToken?: string;
  includeKnowledgeReferences?: boolean;
}

export type LlmToolExecutor = (
  args: Record<string, unknown>,
  context?: LlmToolExecutionContext,
) => unknown;

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  executor: LlmToolExecutor;
  requiresCanteiroContext?: boolean;
}

@Injectable()
export class ToolRegistryService {
  private readonly tools = new Map<string, LlmToolDefinition>();

  constructor(private readonly retrievalService?: RetrievalService) {
    this.register({
      name: 'get_current_datetime',
      description: 'Retorna a data e a hora atual em UTC.',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: 'Formato de saída: iso ou human',
            enum: ['iso', 'human'],
          },
        },
        required: [],
      },
      executor: ({ format = 'iso' }) => {
        const now = new Date();

        if (format === 'human') {
          return now.toLocaleString('pt-BR', {
            timeZone: 'UTC',
          });
        }

        return now.toISOString();
      },
    });

    this.register({
      name: 'search_knowledge_base',
      description:
        'Pesquisa documentos técnicos ingeridos na base vetorial por uma pergunta semântica. Use os trechos retornados como referência técnica, sem confundi-los com os dados dos formulários.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Pergunta ou termo para pesquisar na base documental.',
          },
          limit: {
            type: 'number',
            description: 'Número máximo de trechos relevantes para retornar.',
          },
        },
        required: ['query'],
      },
      executor: async ({ query, limit = 5 }) => {
        if (!this.retrievalService) {
          throw new Error('Serviço de busca documental indisponível.');
        }

        const results = await this.retrievalService.search(
          String(query),
          Math.min(Math.max(Math.trunc(Number(limit) || 5), 1), 10),
        );

        return results
          .filter((item) => item.similarity > 0.7)
          .map((item) => ({
            id: item.id,
            documentId: item.documentId,
            documentName: item.documentName,
            similarity: item.similarity,
            content: item.content,
          }));
      },
    });
  }

  register(tool: LlmToolDefinition): LlmToolDefinition {
    this.tools.set(tool.name, tool);
    return tool;
  }

  getTool(name: string): LlmToolDefinition | undefined {
    return this.tools.get(name);
  }

  getTools(context?: LlmToolExecutionContext) {
    return [...this.tools.values()]
      .filter(
        (tool) =>
          !tool.requiresCanteiroContext ||
          (context?.canteiroId && context.accessToken),
      )
      .map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
  }

  async execute(
    toolCall: ToolCall,
    context?: LlmToolExecutionContext,
  ): Promise<Message> {
    const tool = this.getTool(toolCall.function.name);

    if (!tool) {
      throw new Error(`Ferramenta não registrada: ${toolCall.function.name}`);
    }

    let args: Record<string, unknown> = {};

    try {
      const parsedArguments: unknown = JSON.parse(
        toolCall.function.arguments || '{}',
      );
      if (
        typeof parsedArguments !== 'object' ||
        parsedArguments === null ||
        Array.isArray(parsedArguments)
      ) {
        throw new Error('Os argumentos da ferramenta devem ser um objeto.');
      }

      args = parsedArguments as Record<string, unknown>;
    } catch {
      args = {};
    }

    const result = await tool.executor(args, context);

    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolCall.function.name,
      content: JSON.stringify(result),
    };
  }
}
