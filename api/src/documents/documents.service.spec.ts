import { Test, TestingModule } from '@nestjs/testing';
import { Document } from '@prisma/client';

import { DocumentsService } from './documents.service';
import { PrismaService } from '../database/prisma.service';
import { OcrsService } from '../ocrs/ocrs.service';
import { StorageProvider } from '../storage/storage.provider';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDatabaseService = {
    document: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockStorageProvider = {
    upload: jest.fn(),
  };

  const mockOcrsService = {
    process: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockDatabaseService },
        { provide: StorageProvider, useValue: mockStorageProvider },
        { provide: OcrsService, useValue: mockOcrsService },
      ],
    }).compile();

    service = moduleRef.get(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a document', async () => {
      const userId = 'test-user-id';
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const document = {
        id: 'test-document-id',
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        status: 'UPLOADED',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Document;

      mockStorageProvider.upload.mockResolvedValue(null);
      mockDatabaseService.document.create.mockResolvedValue(document);
      mockOcrsService.process.mockResolvedValue(null);

      const result = await service.create(file, userId);

      expect(mockStorageProvider.upload).toHaveBeenCalledWith(file, expect.stringContaining(file.originalname));
      expect(mockDatabaseService.document.create).toHaveBeenCalledWith({
        data: {
          userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          status: 'UPLOADED',
          filePath: expect.stringContaining(file.originalname),
        },
      });
      expect(mockOcrsService.process).toHaveBeenCalledWith(document.id);
      expect(result).toEqual(document);
    });
  });

  describe('list', () => {
    it('should return documents belonging to the user ordered by createdAt desc', async () => {
      const userId = 'test-user-id';
      const documents = [
        { id: 'test-document-id-2' },
        { id: 'test-document-id-1' },
      ] as Document[];

      mockDatabaseService.document.findMany.mockResolvedValue(documents);

      const result = await service.list(userId);

      expect(mockDatabaseService.document.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(documents);
    });
  });

  describe('get', () => {
    const userId = 'test-user-id';
    const documentId = 'test-document-id';
    const anotherUserId = 'test-another-user-id';

    it('should return the document if it belongs to the user', async () => {
      const document = {
        id: documentId,
        userId,
      } as Document;

      mockDatabaseService.document.findUnique.mockResolvedValue(document);

      const result = await service.get(userId, documentId);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        include: { ocr: true, messages: { orderBy: { createdAt: 'asc' }}},
      });
      expect(result).toEqual(document);
    });

    it('should throw error if document does not exist', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.get(userId, documentId),
      ).rejects.toThrow('Document not found');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        include: { ocr: true, messages: { orderBy: { createdAt: 'asc' }}},
      });
    });

    it('should throw error if document belongs to another user', async () => {
      const document = {
        id: documentId,
        userId: anotherUserId,
      } as Document;

      mockDatabaseService.document.findUnique.mockResolvedValue(document);

      await expect(
        service.get(userId, documentId),
      ).rejects.toThrow('Document not found');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        include: { ocr: true, messages: { orderBy: { createdAt: 'asc' }}},
      });
    });
  });
});
