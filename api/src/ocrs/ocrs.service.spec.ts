import { Test, TestingModule } from '@nestjs/testing';
import { Document } from '@prisma/client';

import { OcrsService } from './ocrs.service';
import { PrismaService } from '../database/prisma.service';
import { StorageProvider } from '../storage/storage.provider';

jest.mock('tesseract.js', () => ({
  OEM: { DEFAULT: 3 },
  createWorker: jest.fn(),
}));
import { createWorker } from 'tesseract.js';

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn(),
}));
import { PDFParse } from 'pdf-parse';

describe('OcrsService', () => {
  let service: OcrsService;

  const mockDatabaseService = {
    document: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    ocr: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockStorageProvider = {
    download: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OcrsService,
        { provide: PrismaService, useValue: mockDatabaseService },
        { provide: StorageProvider, useValue: mockStorageProvider },
      ],
    }).compile();

    service = moduleRef.get(OcrsService);

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    const documentId = 'test-document-id';
    const documentImage = {
      id: documentId,
      mimeType: 'image/png',
      filePath: '/tmp/test.png',
    } as Document;
    const documentPdf = {
      id: documentId,
      mimeType: 'application/pdf',
      filePath: '/tmp/test.pdf',
    } as Document;
    const extractedText = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type
specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop
publishing software like Aldus PageMaker including versions of Lorem Ipsum.`;

    it('should throw if document is not found', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.process(documentId)
      ).rejects.toThrow('Document not found');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
    });

    it('should process image OCR successfully', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(documentImage);
      mockDatabaseService.document.update.mockResolvedValue(true);
      mockStorageProvider.download.mockResolvedValue(Buffer.from('test-buffer'));
      mockDatabaseService.ocr.create.mockResolvedValue(true);
      mockDatabaseService.$transaction.mockImplementation(async (cb) => cb(mockDatabaseService));

      const mockTesseractWorker = {
        recognize: jest.fn().mockResolvedValue({ data: { text: extractedText } }),
        terminate: jest.fn().mockResolvedValue(undefined),
      };
      (createWorker as jest.Mock).mockResolvedValue(mockTesseractWorker);

      await service.process(documentId);

      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId }, data: { status: 'PROCESSING' },
      });
      expect(mockDatabaseService.ocr.create).toHaveBeenCalledWith({
        data: { documentId, text: extractedText },
      });
      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId }, data: { status: 'COMPLETED' },
      });
    });

    it('should update document status as FAILED if OCR fails', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(documentImage);
      mockDatabaseService.document.update.mockResolvedValue(true);
      mockStorageProvider.download.mockResolvedValue(Buffer.from('test-buffer'));
      mockDatabaseService.$transaction.mockImplementation(async (cb) => cb(mockDatabaseService));

      (createWorker as jest.Mock).mockRejectedValue(new Error('OCR failed'));

      await service.process(documentId);

      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId }, data: { status: 'PROCESSING' },
      });
      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId }, data: { status: 'FAILED' },
      });
    });

    it('should process PDF OCR successfully', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(documentPdf);
      mockDatabaseService.document.update.mockResolvedValue(true);
      mockStorageProvider.download.mockResolvedValue(Buffer.from('test-buffer'));
      mockDatabaseService.ocr.create.mockResolvedValue(true);
      mockDatabaseService.$transaction.mockImplementation(async (cb) => cb(mockDatabaseService));

      (PDFParse as unknown as jest.Mock).mockImplementation(() => ({
        getText: jest.fn().mockResolvedValue({ text: extractedText }),
      }));

      await service.process(documentId);

      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId }, data: { status: 'PROCESSING' },
      });
      expect(mockDatabaseService.ocr.create).toHaveBeenCalledWith({
        data: { documentId, text: extractedText },
      });
      expect(mockDatabaseService.document.update).toHaveBeenCalledWith({
        where: { id: documentId }, data: { status: 'COMPLETED' },
      });
    });
  });
});
