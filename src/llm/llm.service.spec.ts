import { LlmService } from './llm.service';
import { ToolRegistryService } from './tool-registry.service';

describe('LlmService', () => {
  it('executes a registered tool and returns the final assistant response', async () => {
    const registry = new ToolRegistryService({
      search: jest.fn().mockResolvedValue([
        {
          content: 'Resposta do vetor de busca',
          similarity: 0.92,
          documentName: 'Manual de forrageiras',
        },
      ]),
    } as any);

    const groqRepository = {
      get: jest
        .fn()
        .mockResolvedValueOnce({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_1',
              type: 'function',
              function: {
                name: 'search_knowledge_base',
                arguments: JSON.stringify({ query: 'qual é o suporte?', limit: 1 }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          role: 'assistant',
          content: 'Posso responder com base na base documental.',
          tool_calls: undefined,
        }),
    };

    const service = new LlmService(registry, groqRepository as any);

    const response = await service.generateWithTools(
      'Você deve usar ferramentas quando necessário.',
      'qual é o suporte?',
    );

    expect(response).toBe('Posso responder com base na base documental.');
    expect(registry.getTool('search_knowledge_base')).toBeDefined();
  });

  it('adds unique retrieved documents to report references when requested', async () => {
    const registry = new ToolRegistryService({
      search: jest.fn().mockResolvedValue([
        {
          content: 'Referência técnica recuperada',
          similarity: 0.92,
          documentName: 'Manual de forrageiras',
        },
        {
          content: 'Outro trecho da mesma fonte',
          similarity: 0.9,
          documentName: 'Manual de forrageiras',
        },
      ]),
    } as any);
    const groqRepository = {
      get: jest
        .fn()
        .mockResolvedValueOnce({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_1',
              type: 'function',
              function: {
                name: 'search_knowledge_base',
                arguments: JSON.stringify({ query: 'manejo de forrageiras' }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          role: 'assistant',
          content: '# Desenvolvimento\nRelatório com base na referência.',
        }),
    };
    const service = new LlmService(registry, groqRepository as any);

    const response = await service.generateWithTools(
      'Gere um relatório com referências.',
      'Gere o relatório.',
      2,
      { includeKnowledgeReferences: true },
    );

    expect(response).toContain('# Referências\n- Manual de forrageiras');
    expect(response.match(/Manual de forrageiras/gu)).toHaveLength(1);
  });
});
