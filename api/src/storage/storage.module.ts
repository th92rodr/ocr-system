import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorageProvider } from './storage.provider';
import { CloudStorageService } from './cloud.storage.service';
import { LocalStorageService } from './local.storage.service';

@Module({
  providers: [
    {
      provide: StorageProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageProvider => {
        return config.get<string>('NODE_ENV') === 'production'
          ? new CloudStorageService(config)
          : new LocalStorageService();
      },
    },
  ],
  exports: [StorageProvider],
})
export class StorageModule {}
