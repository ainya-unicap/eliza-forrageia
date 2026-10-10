import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { LlmModule } from './llm/llm.module';
import { RagModule } from './rag/rag.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LlmModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    RagModule,
  ],
  controllers: [AppController, ChatController],
  providers: [AppService],
})
export class AppModule {}
