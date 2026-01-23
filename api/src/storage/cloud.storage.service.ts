import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { StorageProvider } from './storage.provider';

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
      throw new Error(error.message);
    }
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName).createSignedUrl(path, 60);

    if (error) {
      throw new Error(error.message);
    }

    const response = await fetch(data.signedUrl);

    return Buffer.from(await response.arrayBuffer());
  }
}
