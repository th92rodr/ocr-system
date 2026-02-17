import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { StorageProvider } from './storage.provider';
import { DocumentDownloadError, DocumentUploadError } from './errors';

@Injectable()
export class CloudStorageService implements StorageProvider {
  private readonly client: SupabaseClient;
  private readonly bucketName: string;

  constructor(private readonly config: ConfigService) {
    this.client = createClient(
      config.get<string>('CLOUD_STORAGE_URL')!,
      config.get<string>('CLOUD_STORAGE_KEY')!,
    );
    this.bucketName = config.get<string>('CLOUD_STORAGE_BUCKET_NAME')!;
  }

  async upload(file: Express.Multer.File, path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new DocumentUploadError(error);
    }
  }

  async download(path: string): Promise<Buffer> {
    const signedUrlExpiresInSeconds = 60;

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(path, signedUrlExpiresInSeconds);

    if (error) {
      throw new DocumentDownloadError(error);
    }

    const response = await fetch(data.signedUrl);

    return Buffer.from(await response.arrayBuffer());
  }
}
