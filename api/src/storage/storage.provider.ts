export abstract class StorageProvider {
  abstract upload(file: Express.Multer.File, path: string): Promise<void>;
  abstract download(path: string): Promise<Buffer>;
  abstract delete(path: string): Promise<void>;
}
