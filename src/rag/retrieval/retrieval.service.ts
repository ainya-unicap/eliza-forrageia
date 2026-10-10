
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { EmbeddingService } from '../embedding/embedding.service';

interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma = prisma as PrismaClient,
    private readonly embedding: EmbeddingService,
  ) {}

  async search(
    query: string,
    limit = 5,
    documentId?: string,
  ): Promise<RetrievedChunk[]> {
    const vector = await this.embedding.embedQuery(query);
    const vectorLiteral = `[${vector.join(',')}]`;

    if (documentId) {
      return this.prisma.$queryRaw<RetrievedChunk[]>`
        SELECT
          id,
          "documentId",
          content,
          "chunkIndex",
          (
            1 - (embedding <=> CAST(${vectorLiteral} AS vector))
          )::float8 AS similarity
        FROM "DocumentChunk"
        WHERE embedding IS NOT NULL
          AND "documentId" = ${documentId}::uuid
        ORDER BY embedding <=> CAST(${vectorLiteral} AS vector)
        LIMIT ${limit}
      `;
    }

    return this.prisma.$queryRaw<RetrievedChunk[]>`
      SELECT
        id,
        "documentId",
        content,
        "chunkIndex",
        (
          1 - (embedding <=> CAST(${vectorLiteral} AS vector))
        )::float8 AS similarity
      FROM "DocumentChunk"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> CAST(${vectorLiteral} AS vector)
      LIMIT ${limit}
    `;
  }
}
