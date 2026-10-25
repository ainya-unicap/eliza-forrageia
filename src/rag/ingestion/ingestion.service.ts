import { Injectable } from '@nestjs/common';
import { ChunkingService } from '../chunking/chunking.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { prisma } from '../../../lib/prisma';

@Injectable()
export class IngestionService {
    constructor(
        private readonly chunking: ChunkingService,
        private readonly embedding: EmbeddingService
    ) { }

    async ingest(
        documentId: string,
        content: string,
        title = 'none'
    ) {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { id: true }
        });

        if (!document) {
            throw new Error(`Documento com ID ${documentId} não encontrado.`);
        }

        const chunks = this.chunking.chunk(content);

        const results: { id: string; chunkIndex: number }[] = [];

        for (const [chunkIndex, chunkContent] of chunks.entries()) {
            const vector = await this.embedding.embedDocument(chunkContent, title);

            const chunk = await prisma.documentChunk.create({
                data: {
                    documentId,
                    content: chunkContent,
                    chunkIndex,
                },
                select: {
                    id: true,
                    chunkIndex: true,
                }
            });

            const vectorLiteral = `[${vector.join(', ')}]`;

            await prisma.$executeRaw`
                UPDATE "DocumentChunk"
                SET embedding = CAST(${vectorLiteral} AS vector(768))
                WHERE id = ${chunk.id}::uuid
            `;

            results.push(chunk);
        }

        return {
            documentId,
            title,
            totalChunks: chunks.length,
            chunks: results,
        }
    }
}
