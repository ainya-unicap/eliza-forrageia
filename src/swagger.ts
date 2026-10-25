import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';

/**
 * Configura o Swagger em `/docs` (UI) e `/docs-json` (OpenAPI JSON).
 * Os assets da UI vêm de CDN porque, no Vercel (serverless), os arquivos
 * estáticos do swagger-ui-dist não são servidos pela função.
 */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Elisa API')
    .setDescription(
      'API de chat com LLM (Groq), tool calling e RAG (Gemini embeddings + pgvector).',
    )
    .setVersion('1.0.0')
    .addTag('app', 'Health check')
    .addTag('chat', 'Conversa com o assistente (LLM + tool calling)')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    customCssUrl: `${SWAGGER_CDN}/swagger-ui.css`,
    customJs: [
      `${SWAGGER_CDN}/swagger-ui-bundle.js`,
      `${SWAGGER_CDN}/swagger-ui-standalone-preset.js`,
    ],
  });
}
