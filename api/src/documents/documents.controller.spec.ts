import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Document } from '@prisma/client';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../auth/auth.guard';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockDocumentsService = {
    create: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: mockDocumentsService }],
    })
    .overrideGuard(AuthGuard).useValue(mockAuthGuard)
    .compile();

    controller = moduleRef.get(DocumentsController);
    service = moduleRef.get(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload a document', async () => {
      const userId = 'test-user-id';
      const file = {
        originalname: 'invoice.pdf',
        mimetype: 'application/pdf',
        path: '/uploads/invoice.pdf',
      } as Express.Multer.File;

      const document = {
        id: 'test-document-id',
        userId: userId,
        fileName: 'invoice.pdf',
      } as Document;

      mockDocumentsService.create.mockResolvedValue(document);

      const response = await controller.uploadDocument(file, { user: { sub: userId }} as Request);

      expect(service.create).toHaveBeenCalledWith(file, userId);
      expect(response).toEqual(document);
    });
  });

  describe('list', () => {
    it('should list user documents', async () => {
      const userId = 'test-user-id';
      const documents = [
        { id: 'test-document-1' },
        { id: 'test-document-2' },
      ] as Document[];

      mockDocumentsService.list.mockResolvedValue(documents);

      const response = await controller.list({ user: { sub: userId }} as Request);

      expect(service.list).toHaveBeenCalledWith(userId);
      expect(response).toEqual(documents);
    });
  });

  describe('get', () => {
    it('should get a document by id', async () => {
      const userId = 'test-user-id';
      const documentId = 'test-document-id';
      const document = { id: documentId, userId } as Document;

      mockDocumentsService.get.mockResolvedValue(document);

      const response = await controller.get(documentId, { user: { sub: userId }} as Request);

      expect(service.get).toHaveBeenCalledWith(userId, documentId);
      expect(response).toEqual(document);
    });
  });
});
