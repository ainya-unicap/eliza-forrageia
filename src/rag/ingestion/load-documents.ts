
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';

import { AppModule } from '../../app.module';
import { DocumentLoaderService } from './document-loader.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const loader = app.get(DocumentLoaderService);

    const results = await loader.loadDirectory(
      join(process.cwd(), 'documents'),
    );

    console.log(results);
  } finally {
    await app.close();
  }
}

bootstrap();
