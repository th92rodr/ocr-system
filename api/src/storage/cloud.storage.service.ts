import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { StorageProvider } from './storage.provider';
import { DocumentDownloadError, DocumentUploadError } from './errors';

@Injectable()
export class CloudStorageService implements StorageProvider {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_KEY')!,
    );
    this.bucketName = config.get<string>('SUPABASE_BUCKET_NAME')!;
  }

  async upload(file: Express.Multer.File, path: string): Promise<void> {
    const { error } = await this.supabase.storage
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

    const { data, error } = await this.supabase.storage
      .from(this.bucketName).createSignedUrl(path, signedUrlExpiresInSeconds);

    if (error) {
      throw new DocumentDownloadError(error);
    }

    const response = await fetch(data.signedUrl);

    return Buffer.from(await response.arrayBuffer());
  }
}
