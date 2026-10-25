import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { LlmModule } from './llm/llm.module';
import { RagModule } from './rag/rag.module';
import { ConfigModule } from '@nestjs/config';
import { CanteirosModule } from './canteiros/canteiros.module';

@Module({
  imports: [
    LlmModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RagModule,
    CanteirosModule,
  ],
  controllers: [AppController, ChatController],
  providers: [AppService],
})
export class AppModule {}
