
import { Injectable } from '@nestjs/common';
import { prisma } from '../../../lib/prisma';
import { EmbeddingService } from '../embedding/embedding.service';

interface RetrievedChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

@Injectable()
export class RetrievalService {
  constructor(private readonly embedding: EmbeddingService) {}

  async search(
    query: string,
    limit = 5,
    documentId?: string,
  ): Promise<RetrievedChunk[]> {
    const vector = await this.embedding.embedQuery(query);
    const vectorLiteral = `[${vector.join(',')}]`;

    if (documentId) {
      return prisma.$queryRaw<RetrievedChunk[]>`
        SELECT
          chunk.id,
          chunk."documentId",
          document.name AS "documentName",
          chunk.content,
          chunk."chunkIndex",
          (
            1 - (chunk.embedding <=> CAST(${vectorLiteral} AS vector))
          )::float8 AS similarity
        FROM "DocumentChunk" AS chunk
        JOIN "Document" AS document
          ON document.id = chunk."documentId"
        WHERE chunk.embedding IS NOT NULL
          AND chunk."documentId" = ${documentId}
        ORDER BY chunk.embedding <=> CAST(${vectorLiteral} AS vector)
        LIMIT ${limit}
      `;
    }

    return prisma.$queryRaw<RetrievedChunk[]>`
      SELECT
        chunk.id,
        chunk."documentId",
        document.name AS "documentName",
        chunk.content,
        chunk."chunkIndex",
        (
          1 - (chunk.embedding <=> CAST(${vectorLiteral} AS vector))
        )::float8 AS similarity
      FROM "DocumentChunk" AS chunk
      JOIN "Document" AS document
        ON document.id = chunk."documentId"
      WHERE chunk.embedding IS NOT NULL
      ORDER BY chunk.embedding <=> CAST(${vectorLiteral} AS vector)
      LIMIT ${limit}
    `;
  }
}
