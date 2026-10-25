import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
    @ApiProperty({
        description: 'Mensagem do usuário enviada ao assistente.',
        example: 'Que horas são agora?',
    })
    message: string;

    @ApiPropertyOptional({
        description: 'Identificador da sessão (reservado; ainda não utilizado pelo backend).',
        example: 'sessao-123',
    })
    sessionId?: string;

    @ApiPropertyOptional({
        description:
            'System prompt customizado. Se omitido, usa o padrão: "Você é um assistente útil. Use ferramentas quando forem necessárias para responder com precisão."',
        example: 'Você é um assistente especializado em forragem.',
    })
    system?: string;
}
