import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envSchema } from './config/env.schema';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { DocumentsModule } from './documents/documents.module';
import { OcrsModule } from './ocrs/ocrs.module';
import { MessagesModule } from './messages/messages.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          console.error('❌ Invalid environment variables', parsed.error);
          throw new Error('Invalid environment variables');
        }
        return parsed.data;
      },
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    DocumentsModule,
    OcrsModule,
    MessagesModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
