import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { CANTEIRO_REPORT_SYSTEM_PROMPT } from './prompts/canteiro-report.system-prompt';
import { CanteiroReport, parseCanteiroReport } from './report-parser';

@Injectable()
export class CanteiroReportService {
  constructor(private readonly llmService: LlmService) {}

  async generate(
    canteiroId: string,
    accessToken: string,
  ): Promise<CanteiroReport> {
    if (!accessToken.trim()) {
      throw new UnauthorizedException(
        'Informe o token de acesso no cabeçalho Authorization.',
      );
    }

    const generatedReport = await this.llmService.generateWithTools(
      CANTEIRO_REPORT_SYSTEM_PROMPT,
      'Gere um relatório dos formulários deste canteiro.',
      2,
      {
        canteiroId,
        accessToken: accessToken.trim(),
      },
    );

    return parseCanteiroReport(generatedReport);
  }
}
