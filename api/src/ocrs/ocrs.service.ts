import { Injectable, NotFoundException } from '@nestjs/common';
import { OEM, createWorker } from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import { PDFParse } from 'pdf-parse';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

import { PrismaService } from '../database/prisma.service';
import { StorageProvider } from '../storage/storage.provider';
import { EmptyOcrResultError } from './errors';

@Injectable()
export class OcrsService {
  constructor(
    private readonly database: PrismaService,
    private readonly storageProvider: StorageProvider,
  ) {}

  async process(documentId: string): Promise<void> {
    const document = await this.database.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    try {
      await this.database.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' },
      });

      const text = await this.extractText(document.mimeType, document.filePath);

      await this.database.$transaction(async (tx) => {
        await tx.ocr.create({
          data: { documentId, text },
        });

        await tx.document.update({
          where: { id: documentId },
          data: { status: 'COMPLETED' },
        });
      });

    } catch (error) {
      console.error('❌ OCR processing failed: ', error);

      await this.database.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
    }
  }

  private async extractText(mimeType: string, filePath: string): Promise<string> {
    const fileBuffer = await this.storageProvider.download(filePath);

    if (mimeType === 'application/pdf') {
      return this.extractTextFromPDF(fileBuffer);
    }
    return this.extractTextFromImage(fileBuffer);
  }

  private async extractTextFromImage(fileBuffer: Buffer): Promise<string> {
    const langs = 'eng+por';

    let workerError: Error | null = null;

    const worker = await createWorker(langs, OEM.DEFAULT, {
      errorHandler: (error) => {
        workerError = error;
      },
    });

    try {
      const result = await worker.recognize(fileBuffer);

      if (workerError) {
        throw workerError;
      }

      const text = result.data.text.trim();
      if (!text) {
        throw new EmptyOcrResultError();
      }

      return text;

    } finally {
      await worker.terminate();
    }
  }

  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    const minimumTextLength = 50;

    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();

    const text = result.text.trim();
    if (text.length < minimumTextLength) {
      return this.ocrPdf(fileBuffer);
    }

    return text;
  }

  private async ocrPdf(fileBuffer: Buffer): Promise<string> {
    const allPages = -1;
    const temporaryDir = '/tmp/ocrs';
    const temporaryFile = 'page';

    const filePath = join(temporaryDir, `${Date.now()}.pdf`);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fileBuffer);

    const converter = fromPath(filePath, {
      quality: 100,
      density: 600,
      format: 'png',
      savePath: temporaryDir,
      saveFilename: temporaryFile,
      preserveAspectRatio: true,
    });
    const pages = await converter.bulk(allPages);

    let extractText = '';

    for (const page of pages) {
      const pageBuffer = await fs.readFile(page.path!);
      extractText += await this.extractTextFromImage(pageBuffer);
      extractText += '\n';
    }

    await fs.rm(temporaryDir, { recursive: true, force: true });

    return extractText;
  }
}
