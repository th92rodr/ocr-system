import { Module } from '@nestjs/common';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { OcrsModule } from '../ocrs/ocrs.module';

@Module({
  imports: [AuthModule, StorageModule, OcrsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
