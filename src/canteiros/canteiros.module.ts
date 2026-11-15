import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { CanteiroReportService } from './canteiro-report.service';
import { PrincipalApiClient } from './infrastructure/principal-api.client';
import { GetCanteiroFormulariosTool } from './tools/get-canteiro-formularios.tool';
import { RagModule } from '../rag/rag.module';
import { CanteiroReportController } from './canteiro-report.controller';

@Module({
  imports: [LlmModule, RagModule],
  providers: [
    CanteiroReportService,
    PrincipalApiClient,
    GetCanteiroFormulariosTool,
  ],
  controllers: [CanteiroReportController],
  exports: [CanteiroReportService],
})
export class CanteirosModule {}
