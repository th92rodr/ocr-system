import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Message } from '@prisma/client';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { CreateMessageDto, MessageListResponseDto } from './dtos/messages.dto';
import { AuthGuard } from '../auth/auth.guard';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    create: jest.fn(),
    list: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockMessagesService }],
    })
    .overrideGuard(AuthGuard).useValue(mockAuthGuard)
    .compile();

    controller = moduleRef.get(MessagesController);
    service = moduleRef.get(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'test-user-id';
    const documentId = 'test-document-id';
    const body: CreateMessageDto = { content: 'Test message content' };
    const message: Message = {
      id: 'test-message-id',
      documentId,
      content: body.content,
      role: 'ASSISTANT',
      createdAt: new Date(),
    };

    it('should create message', async () => {
      mockMessagesService.create.mockResolvedValue(message);

      const response = await controller.create({ user: { sub: userId }} as Request, documentId, body);

      expect(service.create).toHaveBeenCalledWith(userId, documentId, body.content);
      expect(response).toEqual(message);
    });
  });

  describe('list', () => {
    const userId = 'test-user-id';
    const documentId = 'test-document-id';
    const messages: MessageListResponseDto = {
      data: [
        { id: 'test-message-1', documentId, content: 'Test message 1', role: 'USER', createdAt: new Date() },
        { id: 'test-message-2', documentId, content: 'Test message 2', role: 'ASSISTANT', createdAt: new Date() },
      ],
      nextCursor: null,
    };

    it('should list messages', async () => {
      mockMessagesService.list.mockResolvedValue(messages);

      const response = await controller.list({ user: { sub: userId }} as Request, documentId, {});

      expect(service.list).toHaveBeenCalledWith(userId, documentId, undefined, undefined);
      expect(response).toEqual(messages);
    });

    it('should list messages with pagination', async () => {
      const limit = 20;
      const cursor = 'test-cursor';

      mockMessagesService.list.mockResolvedValue(messages);

      const response = await controller.list({ user: { sub: userId }} as Request, documentId, { limit, cursor });

      expect(service.list).toHaveBeenCalledWith(userId, documentId, limit, cursor);
      expect(response).toEqual(messages);
    });
  });
});
