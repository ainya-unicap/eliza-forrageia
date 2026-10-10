import { LlmService } from './llm.service';
import { ToolRegistryService } from './tool-registry.service';

describe('LlmService', () => {
  it('executes a registered tool and returns the final assistant response', async () => {
    const registry = new ToolRegistryService({
      search: jest.fn().mockResolvedValue([
        { content: 'Resposta do vetor de busca', similarity: 0.92 },
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
});
