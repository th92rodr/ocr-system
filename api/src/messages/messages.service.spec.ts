import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Document, Message } from '@prisma/client';

import { MessagesService } from './messages.service';
import { PrismaService } from '../database/prisma.service';
import { LLMClient } from './llm/llm.client';
import { MessageListResponseDto } from './dtos/messages.dto';

describe('MessagesService', () => {
  let service: MessagesService;
  const paginationMaxLimit = 100;
  const paginationDefaultLimit = 20;

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

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'PAGINATION_MAX_LIMIT') return paginationMaxLimit;
      if (key === 'PAGINATION_DEFAULT_LIMIT') return paginationDefaultLimit;
      return null;
    }),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockDatabaseService },
        { provide: LLMClient, useValue: mockLlmClient },
        { provide: ConfigService, useValue: mockConfigService },
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

    const message: Message = {
      id: 'test-message-id',
      documentId,
      content,
      role: 'USER',
      createdAt: new Date(),
    };
    const responseMessage: Message = {
      id: 'test-response-message-id',
      documentId,
      content: responseContent,
      role: 'ASSISTANT',
      createdAt: new Date(),
    };

    it('should create a message', async () => {
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

    it('should throw error if LLM client returns an error', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.create.mockResolvedValueOnce(message);
      mockLlmClient.generateResponse.mockRejectedValueOnce({ message: 'LLM service is down' });

      await expect(
        service.create(userId, documentId, content),
      ).rejects.toThrow('LLM unavailable');

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
    });
  });

  describe('list', () => {
    const userId = 'test-user-id';
    const documentId = 'test-document-id';
    const anotherUserId = 'test-another-user-id';

    const document = {
      id: documentId,
      userId,
    } as Document;

    const message1: Message = { id: 'test-message-id-1', documentId, content: 'Test message 1', role: 'USER', createdAt: new Date() };
    const message2: Message = { id: 'test-message-id-2', documentId, content: 'Test message 2', role: 'ASSISTANT', createdAt: new Date() };
    const message3: Message = { id: 'test-message-id-3', documentId, content: 'Test message 3', role: 'USER', createdAt: new Date() };
    const message4: Message = { id: 'test-message-id-4', documentId, content: 'Test message 4', role: 'ASSISTANT', createdAt: new Date() };
    const response: MessageListResponseDto = {
      data: [message1, message2, message3, message4],
      nextCursor: null,
    };

    it('should return all messages (ordered by createdAt asc with default limit)', async () => {
      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockResolvedValue([message1, message2, message3, message4]);

      const result = await service.list(userId, documentId);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: paginationDefaultLimit+1,
        skip: 0,
      });
      expect(result).toEqual(response);
    });

    it('should return all messages (ordered by createdAt asc with max limit)', async () => {
      const limit = 200;

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockResolvedValue([message1, message2, message3, message4]);

      const result = await service.list(userId, documentId, limit, undefined);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: paginationMaxLimit+1,
        skip: 0,
      });
      expect(result).toEqual(response);
    });

    it('should return all messages (ordered by createdAt asc with limit and cursor)', async () => {
      const limit = 20;
      const cursor = 'test-message-id-1';

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockResolvedValue([message1, message2, message3, message4]);

      const result = await service.list(userId, documentId, limit, cursor);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit+1,
        cursor: { id: cursor },
        skip: 1,
      });
      expect(result).toEqual(response);
    });

    it('should return messages and next cursor (ordered by createdAt asc with limit)', async () => {
      const limit = 1;
      const response: MessageListResponseDto = {
        data: [message1],
        nextCursor: message2.id,
      };

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockResolvedValue([message1, message2, message3, message4]);

      const result = await service.list(userId, documentId, limit, undefined);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit+1,
        skip: 0,
      });
      expect(result).toEqual(response);
    });

    it('should return messages and next cursor (ordered by createdAt asc with limit and cursor)', async () => {
      const limit = 2;
      const cursor = 'test-message-id-2';
      const response: MessageListResponseDto = {
        data: [message2, message3],
        nextCursor: message4.id,
      };

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockResolvedValue([message2, message3, message4]);

      const result = await service.list(userId, documentId, limit, cursor);

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit+1,
        cursor: { id: cursor },
        skip: 1,
      });
      expect(result).toEqual(response);
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

    it('should throw error if cursor is invalid', async () => {
      const limit = 1;
      const cursor = 'invalid-cursor';

      mockDatabaseService.document.findUnique.mockResolvedValue(document);
      mockDatabaseService.message.findMany.mockRejectedValueOnce({ code: 'P2025' });

      await expect(
        service.list(userId, documentId, limit, cursor),
      ).rejects.toThrow('Invalid cursor');

      expect(mockDatabaseService.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockDatabaseService.message.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit+1,
        cursor: { id: cursor },
        skip: 1,
      });
    });
  });
});
