import { Test, TestingModule } from '@nestjs/testing';
import { Document, Message } from '@prisma/client';

import { MessagesService } from './messages.service';
import { PrismaService } from '../database/prisma.service';
import { LLMClient } from './llm/llm.client';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockDatabaseService = {
    document: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockLlmClient = {
    generateResponse: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockDatabaseService },
        { provide: LLMClient, useValue: mockLlmClient },
      ],
    }).compile();

    service = moduleRef.get(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'test-user-id';
    const documentId = 'test-document-id';
    const ocrId = 'test-ocr-id';
    const ocrText = 'Extracted OCR text';
    const content = 'Test message content';
    const responseContent = 'Test response message content';

    it('should create a message', async () => {
      const document = {
        id: documentId,
        userId,
        status: 'COMPLETED',
        ocr: {
          id: ocrId,
          text: ocrText,
          documentId,
        }
      };

      const message = {
        id: 'test-message-id',
        documentId,
        content,
        role: 'USER',
        createdAt: new Date(),
      } as Message;

      const responseMessage = {
        id: 'test-response-message-id',
        documentId,
        content: responseContent,
        role: 'ASSISTANT',
        createdAt: new Date(),
      } as Message;

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.create.mockResolvedValueOnce(message);
      mockLlmClient.generateResponse.mockResolvedValue(responseContent);
      mockDatabaseService.message.create.mockResolvedValueOnce(responseMessage);

      const result = await service.create(userId, documentId, content);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        include: { ocr: true },
      });
      expect(mockDatabaseService.message.create).toHaveBeenNthCalledWith(1, {
        data: {
          documentId,
          role: 'USER',
          content,
        },
      });
      expect(mockLlmClient.generateResponse).toHaveBeenCalledWith(expect.stringContaining(content));
      expect(mockDatabaseService.message.create).toHaveBeenNthCalledWith(2, {
        data: {
          documentId,
          role: 'ASSISTANT',
          content: responseContent,
        },
      });
      expect(result).toEqual(responseMessage);
    });

    it('should throw error if document does not exist', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.create(userId, documentId, content),
      ).rejects.toThrow('Document not found');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        include: { ocr: true },
      });
    });

    it('should throw error if document was not ocr processed', async () => {
      const document = {
        id: documentId,
        userId,
        status: 'COMPLETED',
        ocr: null,
      };

      mockDatabaseService.document.findUnique.mockResolvedValue(document);

      await expect(
        service.create(userId, documentId, content),
      ).rejects.toThrow('Document not processed yet');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        include: { ocr: true },
      });
    });
  });

  describe('list', () => {
    const userId = 'test-user-id';
    const documentId = 'test-document-id';
    const anotherUserId = 'test-another-user-id';

    it('should return messages referents to a document belonging to the user ordered by createdAt asc', async () => {
      const document = {
        id: documentId,
        userId,
      } as Document;

      const messages = [
        { id: 'test-message-id-2' },
        { id: 'test-message-id-1' },
      ] as Message[];

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockResolvedValue(messages);

      const result = await service.list(userId, documentId);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(messages);
    });

    it('should throw error if document does not exist', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.list(userId, documentId),
      ).rejects.toThrow('Document not found');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
    });

    it('should throw error if document belongs to another user', async () => {
      const document = {
        id: documentId,
        userId: anotherUserId,
      } as Document;

      mockDatabaseService.document.findUnique.mockResolvedValue(document);

      await expect(
        service.list(userId, documentId),
      ).rejects.toThrow('Document not found');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
    });
  });
});
