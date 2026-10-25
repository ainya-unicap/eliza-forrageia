import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { CanteiroReportService } from './canteiro-report.service';
import { PrincipalApiClient } from './infrastructure/principal-api.client';
import { GetCanteiroFormulariosTool } from './tools/get-canteiro-formularios.tool';

@Module({
  imports: [LlmModule],
  providers: [
    CanteiroReportService,
    PrincipalApiClient,
    GetCanteiroFormulariosTool,
  ],
  exports: [CanteiroReportService],
})
export class CanteirosModule {}
