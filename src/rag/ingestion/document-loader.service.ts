
import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { IngestionService } from './ingestion.service';

@Injectable()
export class DocumentLoaderService {
  private readonly logger = new Logger(DocumentLoaderService.name);

  constructor(
    private readonly prisma = prisma as PrismaClient,
    private readonly ingestion: IngestionService,
  ) {}

  async loadDirectory(directory: string) {
    const files = await readdir(directory, {
      withFileTypes: true,
    });

    const results: {
      file: string;
      status: 'success' | 'skipped' | 'error';
      detail?: string;
    }[] = [];

    for (const entry of files) {
      if (!entry.isFile()) continue;

      const extension = extname(entry.name).toLowerCase();

      if (!['.pdf', '.docx', '.txt'].includes(extension)) {
        continue;
      }

      const filePath = join(directory, entry.name);

      try {
        const rawText = await this.extractText(filePath, extension);
        const content = this.cleanText(rawText);

        if (!content) {
          results.push({
            file: entry.name,
            status: 'skipped',
            detail: 'Nenhum texto útil encontrado.',
          });
          continue;
        }

        const title = basename(entry.name, extension);

        const document = await this.prisma.document.create({
          data: { name: title },
        });

        try {
          const ingestion = await this.ingestion.ingest(
            document.id,
            content,
            title,
          );

          results.push({
            file: entry.name,
            status: 'success',
            detail: `${ingestion.totalChunks} chunks processados.`,
          });
        } catch (error) {
          // Remove o documento se a ingestão falhar.
          await this.prisma.document.delete({
            where: { id: document.id },
          });

          throw error;
        }

        this.logger.log(`Documento ingerido: ${entry.name}`);
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : String(error);

        this.logger.error(`Falha em ${entry.name}: ${detail}`);

        results.push({
          file: entry.name,
          status: 'error',
          detail,
        });
      }
    }

    return results;
  }

  private async extractText(
    filePath: string,
    extension: string,
  ): Promise<string> {
    if (extension === '.txt') {
      return readFile(filePath, 'utf-8');
    }

    if (extension === '.docx') {
      const result = await mammoth.extractRawText({
        path: filePath,
      });

      return result.value;
    }

    if (extension === '.pdf') {
      const buffer = await readFile(filePath);
      const parser = new PDFParse({ data: buffer });

      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    return '';
  }

  private cleanText(text: string): string {
    return text
      .normalize('NFC')
      .replace(/\u0000/g, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
