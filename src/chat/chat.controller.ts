import { Body, Controller, Post } from '@nestjs/common';
import {
    ApiBody,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { LlmService } from '../llm/llm.service';
import { ChatDto } from './chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(
        private readonly llmService: LlmService,
    ) {}

    @Post()
    @ApiOperation({
        summary: 'Conversar com o assistente',
        description:
            'Envia a mensagem ao LLM (Groq). O modelo pode chamar as ferramentas `get_current_datetime` e `search_knowledge_base` (RAG) em até 2 rodadas antes de responder.',
    })
    @ApiBody({ type: ChatDto })
    @ApiOkResponse({
        description: 'Resposta final do modelo em texto puro.',
        schema: { type: 'string', example: 'Agora são 14:32 (UTC) de 25/10/2026.' },
    })
    @ApiInternalServerErrorResponse({ description: 'Falha ao consultar o LLM.' })
    async chat(@Body() chatDto: ChatDto) {
        const systemPrompt =
            chatDto.system ??
            'Você é um assistente útil. Use ferramentas quando forem necessárias para responder com precisão.';

        return this.llmService.generate(systemPrompt, chatDto.message);
    }
}
