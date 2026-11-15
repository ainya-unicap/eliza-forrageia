import { Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CanteiroReportService } from './canteiro-report.service';

@ApiTags('canteiros')
@Controller('canteiros')
export class CanteiroReportController {
  constructor(private readonly reportService: CanteiroReportService) {}

  @Post(':id/formularios')
  generateReport(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim();
    return this.reportService.generate(id, accessToken ?? '');
  }
}
