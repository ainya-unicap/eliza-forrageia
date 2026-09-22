import { Body, Controller } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { ChatDto } from './chat.dto';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly llmService: LlmService
    ){}

    async chat(@Body() chatDto: ChatDto) {
        return this.llmService.generate(chatDto.message, chatDto.sessionId);
    }
}
