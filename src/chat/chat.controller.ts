
import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { CanteiroReportService } from '../canteiros/canteiro-report.service';

import { LlmService } from '../llm/llm.service';
import { ChatDto } from './chat.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly llmService: LlmService,
    private readonly canteiroReportService: CanteiroReportService,
  ) {}


  @Post()
  async chat(@Body() chatDto: ChatDto) {
    const systemPrompt =
      chatDto.system ??
      'Você é um assistente útil. Use ferramentas quando forem necessárias para responder com precisão.';


    return this.llmService.generate(systemPrompt, chatDto.message);
  }

  @Post('canteiros/:id/formularios')
  async generateCanteiroReport(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim();

    return {
      message: await this.canteiroReportService.generate(id, accessToken ?? ''),
    };
  }
}
