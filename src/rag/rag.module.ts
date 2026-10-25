import { forwardRef, Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { ChunkingModule } from './chunking/chunking.module';
import { EmbeddingService } from './embedding/embedding.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { IngestionService } from './ingestion/ingestion.service';
import { IngestionController } from './ingestion/ingestion.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  providers: [RagService, EmbeddingService, RetrievalService, IngestionService],
  imports: [ChunkingModule, forwardRef(() => LlmModule)],
  controllers: [IngestionController],
  exports: [RetrievalService, IngestionService, EmbeddingService],
})
export class RagModule {}
