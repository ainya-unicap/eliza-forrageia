import { CanteiroReportService } from './canteiro-report.service';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/retrieval/retrieval.service';
import { PrincipalApiClient } from './infrastructure/principal-api.client';

describe('CanteiroReportService', () => {
  const formularios = [{ nome: 'Avaliação de pastagem', resultado: 'Boa' }];
  const chunks = [
    {
      documentName: 'Manual de manejo de forrageiras',
      content: 'Trecho técnico recuperado.',
    },
    {
      documentName: 'Manual de manejo de forrageiras',
      content: 'Outro trecho do mesmo documento.',
    },
  ];

  let llmService: { generateWithoutTools: jest.Mock };
  let principalApiClient: { getCanteiroFormularios: jest.Mock };
  let retrievalService: { search: jest.Mock };
  let service: CanteiroReportService;

  beforeEach(() => {
    llmService = {
      generateWithoutTools: jest
        .fn()
        .mockResolvedValue(
          '# introduction\nContexto\n# objective\nObjetivo\n# development\nAnálise\n# final_thoughts\nConclusão',
        ),
    };
    principalApiClient = {
      getCanteiroFormularios: jest.fn().mockResolvedValue(formularios),
    };
    retrievalService = {
      search: jest.fn().mockResolvedValue(chunks),
    };
    service = new CanteiroReportService(
      llmService as unknown as LlmService,
      principalApiClient as unknown as PrincipalApiClient,
      retrievalService as unknown as RetrievalService,
    );
  });

  it('fetches canteiro forms and RAG documents before generating a report', async () => {
    const report = await service.generate('canteiro-1', ' token ');

    expect(principalApiClient.getCanteiroFormularios).toHaveBeenCalledWith(
      'canteiro-1',
      'token',
    );
    expect(retrievalService.search).toHaveBeenCalledTimes(1);
    expect(retrievalService.search.mock.calls[0][0]).toContain(
      'Avaliação de pastagem',
    );
    expect(llmService.generateWithoutTools).toHaveBeenCalledTimes(1);
    expect(llmService.generateWithoutTools.mock.calls[0][1]).toContain(
      JSON.stringify(formularios),
    );
    expect(llmService.generateWithoutTools.mock.calls[0][1]).toContain(
      'Manual de manejo de forrageiras',
    );
    expect(report.references).toBe('- Manual de manejo de forrageiras');
    expect(report).toMatchObject({
      introduction: 'Contexto',
      objective: 'Objetivo',
      development: 'Análise',
      final_thoughts: 'Conclusão',
    });
  });

  it('propagates external API failures instead of returning an empty report', async () => {
    const error = new Error('Falha ao consultar API principal');
    principalApiClient.getCanteiroFormularios.mockRejectedValue(error);

    await expect(service.generate('canteiro-1', 'token')).rejects.toBe(error);
    expect(retrievalService.search).not.toHaveBeenCalled();
    expect(llmService.generateWithoutTools).not.toHaveBeenCalled();
  });

  it('reports when no document chunks were found instead of leaving references blank', async () => {
    retrievalService.search.mockResolvedValue([]);

    const report = await service.generate('canteiro-1', 'token');

    expect(report.references).toBe(
      'Nenhum documento relevante foi recuperado da base documental.',
    );
  });
});
