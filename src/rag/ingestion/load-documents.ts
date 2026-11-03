
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { AppModule } from '../../app.module';
import { DocumentLoaderService } from './document-loader.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const loader = app.get(DocumentLoaderService);
    const requestedDirectory = process.argv[2];
    const directories = requestedDirectory
      ? [resolve(process.cwd(), requestedDirectory)]
      : ['documentos', 'documents'].map((directory) =>
          resolve(process.cwd(), directory),
        );
    const directory = directories.find(existsSync);

    if (!directory) {
      throw new Error(
        'Pasta de documentos não encontrada. Crie "documentos" ou "documents" na raiz do projeto.',
      );
    }

    const results = await loader.loadDirectory(directory);

    if (results.length === 0) {
      throw new Error(
        `Nenhum arquivo PDF, DOCX ou TXT encontrado em ${directory}.`,
      );
    }

    console.log(results);

    if (results.some((result) => result.status === 'error')) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
