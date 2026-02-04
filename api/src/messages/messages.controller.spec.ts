import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Message } from '@prisma/client';

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dtos/messages.dto';
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
    it('should create message', async () => {
      const userId = 'test-user-id';
      const documentId = 'test-document-id';
      const body: CreateMessageDto = { content: 'Test message content' };
      const message = {
        id: 'test-message-id',
        documentId,
        content: body.content,
      } as Message;

      mockMessagesService.create.mockResolvedValue(message);

      const response = await controller.create(documentId, body, { user: { sub: userId }} as Request);

      expect(service.create).toHaveBeenCalledWith(userId, documentId, body.content);
      expect(response).toEqual(message);
    });
  });

  describe('list', () => {
    it('should list messages', async () => {
      const userId = 'test-user-id';
      const documentId = 'test-document-id';
      const messages = [
        { id: 'test-document-1' },
        { id: 'test-document-2' },
      ] as Message[];

      mockMessagesService.list.mockResolvedValue(messages);

      const response = await controller.list(documentId, { user: { sub: userId }} as Request);

      expect(service.list).toHaveBeenCalledWith(userId, documentId);
      expect(response).toEqual(messages);
    });
  });
});
