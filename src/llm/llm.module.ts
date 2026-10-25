import { forwardRef, Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { GroqRepository } from './groq/groqRepository';
import { LlmService } from './llm.service';
import { ToolRegistryService } from './tool-registry.service';

@Module({
  imports: [forwardRef(() => RagModule)],
  providers: [GroqRepository, ToolRegistryService, LlmService],
  exports: [LlmService, ToolRegistryService],
})
export class LlmModule {}
