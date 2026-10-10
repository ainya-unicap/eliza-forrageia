import { Body, Controller, Post } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { ChatDto } from './chat.dto';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly llmService: LlmService,
    ) {}

    @Post()
    async chat(@Body() chatDto: ChatDto) {
        const systemPrompt =
            chatDto.system ??
            'Você é um assistente útil. Use ferramentas quando forem necessárias para responder com precisão.';

        return this.llmService.generate(systemPrompt, chatDto.message);
    }
}
