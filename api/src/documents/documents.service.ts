import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Document, Message, Ocr } from '@prisma/client';
import PDFDocument from 'pdfkit';

import { PrismaService } from '../database/prisma.service';
import { OcrsService } from '../ocrs/ocrs.service';
import { StorageProvider } from '../storage/storage.provider';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly database: PrismaService,
    private readonly ocrsService: OcrsService,
    private readonly storageProvider: StorageProvider,
  ) {}

  async create(file: Express.Multer.File, userId: string): Promise<Document> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const filepath = `${userId}/${Date.now()}-${file.originalname}`;

    try {
      await this.storageProvider.upload(file, filepath);

      const document = await this.database.document.create({
        data: {
          userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          status: 'UPLOADED',
          filePath: filepath,
        },
      });

      await this.ocrsService.process(document.id);

      return document;

    } catch {
      await this.storageProvider.delete(filepath);

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async list(userId: string): Promise<Document[]> {
    try {
      return this.database.document.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

    } catch {
      throw new InternalServerErrorException('Failed to list documents');
    }
  }

  async get(userId: string, documentId: string): Promise<Document & { ocr: Ocr | null, messages: Message[] }> {
    try {
      const document = await this.database.document.findUnique({
        where: { id: documentId },
        include: {
          ocr: true,
          messages: { orderBy: { createdAt: 'asc' }},
        },
      });

      if (!document || document.userId !== userId) {
        throw new NotFoundException('Document not found');
      }

      return document;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch document');
    }
  }

  async generatePdf(userId: string, documentId: string): Promise<Buffer> {
    try {
      const document = await this.get(userId, documentId);

      const ocrText: string = document.ocr?.text || '';
      const messages: Message[] = document.messages || [];

      return await new Promise<Buffer>((resolve, reject) => {
        try {
          const pdf = new PDFDocument({ margin: 20, layout: 'portrait' });
          const chunks: Buffer[] = [];

          pdf.on('data', chunk => chunks.push(chunk));
          pdf.on('end', () => resolve(Buffer.concat(chunks)));
          pdf.on('error', error => reject(error));

          pdf.fontSize(13).text('Original file: ').fontSize(11).text(document.fileName);
          pdf.moveDown(2);
          pdf.fontSize(13).text('Extracted Text:').moveDown().fontSize(11).text(ocrText);
          pdf.moveDown(2);
          pdf.fontSize(13).text('Messages:');
          pdf.moveDown();

          for (const message of messages) {
            pdf.fontSize(11).text(`${this.capitalize(message.role)}: ${message.content}`).moveDown();
          }

          pdf.end();

        } catch (error) {
          reject(error);
        }
      });

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to generate document PDF');
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
}
