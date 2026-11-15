import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/retrieval/retrieval.service';
import { CANTEIRO_REPORT_SYSTEM_PROMPT } from './prompts/canteiro-report.system-prompt';
import { PrincipalApiClient } from './infrastructure/principal-api.client';
import { CanteiroReport, parseCanteiroReport } from './report-parser';

@Injectable()
export class CanteiroReportService {
  constructor(
    private readonly llmService: LlmService,
    private readonly principalApiClient: PrincipalApiClient,
    private readonly retrievalService: RetrievalService,
  ) {}

  async generate(
    canteiroId: string,
    accessToken: string,
  ): Promise<CanteiroReport> {
    if (!accessToken.trim()) {
      throw new UnauthorizedException(
        'Informe o token de acesso no cabeçalho Authorization.',
      );
    }

    const formularios = await this.principalApiClient.getCanteiroFormularios(
      canteiroId,
      accessToken.trim(),
    );
    const formulariosJson = JSON.stringify(formularios);
    const query = `Analise tecnicamente os dados deste canteiro de forrageiras e pastagens: ${formulariosJson.slice(0, 4000)}`;
    const chunks = await this.retrievalService.search(query, 8);
    const documents = chunks.map((chunk) => ({
      documentName: chunk.documentName,
      content: chunk.content,
    }));

    const generatedReport = await this.llmService.generateWithoutTools(
      CANTEIRO_REPORT_SYSTEM_PROMPT,
      [
        'Gere o relatório usando obrigatoriamente as fontes abaixo.',
        'FORMULÁRIOS DO CANTEIRO:',
        formulariosJson,
        'TRECHOS DA DOCUMENTAÇÃO TÉCNICA RECUPERADOS PELO RAG:',
        JSON.stringify(documents),
        'Se usar um trecho técnico, cite o documentName correspondente no tópico Referências.',
      ].join('\n\n'),
    );

    const report = parseCanteiroReport(generatedReport);
    const retrievedTitles = [
      ...new Set(
        documents
          .map(({ documentName }) => documentName.trim())
          .filter(Boolean),
      ),
    ];

    report.references = retrievedTitles.length
      ? retrievedTitles.map((title) => `- ${title}`).join('\n')
      : 'Nenhum documento relevante foi recuperado da base documental.';

    return report;
  }
}
