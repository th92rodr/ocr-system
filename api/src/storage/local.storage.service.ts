import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join, resolve } from 'path';

import { StorageProvider } from './storage.provider';

@Injectable()
export class LocalStorageService implements StorageProvider {
  private readonly basePath = resolve('./uploads');

  async upload(file: Express.Multer.File, path: string): Promise<void> {
    const filepath = join(this.basePath, path);

    await fs.mkdir(dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, file.buffer);
  }

  async download(path: string): Promise<Buffer> {
    const filepath = join(this.basePath, path);
    return fs.readFile(filepath);
  }
}
