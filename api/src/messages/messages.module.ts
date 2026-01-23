import { Module } from '@nestjs/common';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AuthModule } from '../auth/auth.module';
import { LLMClient } from './llm/llm.client';
import { GroqClient } from './llm/groq.client';

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [MessagesService,
    {
      provide: LLMClient,
      useClass: GroqClient,
    },
  ],
})
export class MessagesModule {}
