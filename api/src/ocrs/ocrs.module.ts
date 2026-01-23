import { Module } from '@nestjs/common';

import { OcrsService } from './ocrs.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [OcrsService],
  exports: [OcrsService],
})
export class OcrsModule {}
