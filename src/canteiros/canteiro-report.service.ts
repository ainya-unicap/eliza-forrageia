import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { CANTEIRO_REPORT_SYSTEM_PROMPT } from './prompts/canteiro-report.system-prompt';

@Injectable()
export class CanteiroReportService {
  constructor(private readonly llmService: LlmService) {}

  generate(canteiroId: string, accessToken: string): Promise<string> {
    if (!accessToken.trim()) {
      throw new UnauthorizedException(
        'Informe o token de acesso no cabeçalho Authorization.',
      );
    }

    return this.llmService.generateWithTools(
      CANTEIRO_REPORT_SYSTEM_PROMPT,
      'Gere um relatório dos formulários deste canteiro.',
      2,
      {
        canteiroId,
        accessToken: accessToken.trim(),
      },
    );
  }
}
