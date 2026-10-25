import { Injectable, OnModuleInit } from '@nestjs/common';
import { ToolRegistryService } from '../../llm/tool-registry.service';
import { PrincipalApiClient } from '../infrastructure/principal-api.client';

@Injectable()
export class GetCanteiroFormulariosTool implements OnModuleInit {
  constructor(
    private readonly toolRegistry: ToolRegistryService,
    private readonly principalApiClient: PrincipalApiClient,
  ) {}

  onModuleInit() {
    this.toolRegistry.register({
      name: 'get_canteiro_formularios',
      description:
        'Consulta os formulários do canteiro recebido na solicitação atual. Use esta ferramenta antes de elaborar o relatório.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      requiresCanteiroContext: true,
      executor: (_args, context) => {
        if (!context?.canteiroId || !context.accessToken) {
          throw new Error(
            'O identificador do canteiro e o token de acesso são obrigatórios.',
          );
        }

        return this.principalApiClient.getCanteiroFormularios(
          context.canteiroId,
          context.accessToken,
        );
      },
    });
  }
}
