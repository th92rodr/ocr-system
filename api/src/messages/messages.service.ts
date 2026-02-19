import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Message } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { LLMClient } from './llm/llm.client';
import { DocumentNotProcessedError } from './errors';
import { MessageListResponseDto } from './dtos/messages.dto';

@Injectable()
export class MessagesService {
  private readonly paginationMaxLimit: number;
  private readonly paginationDefaultLimit: number;

  constructor(
    private readonly database: PrismaService,
    private readonly llmClient: LLMClient,
    private readonly config: ConfigService,
  ) {
    this.paginationMaxLimit = config.get<number>('PAGINATION_MAX_LIMIT')!;
    this.paginationDefaultLimit = config.get<number>('PAGINATION_DEFAULT_LIMIT')!;
  }

  async create(userId: string, documentId: string, content: string): Promise<Message> {
    const document = await this.database.document.findUnique({
      where: { id: documentId },
      include: { ocr: true },
    });

    if (!document || document.userId !== userId) {
      throw new NotFoundException('Document not found');
    }

    if (!document.ocr) {
      throw new DocumentNotProcessedError();
    }

    try {
      await this.database.message.create({
        data: {
          documentId,
          role: 'USER',
          content,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to create message');
    }

    const prompt = this.buildPrompt(document.ocr.text, content);

    try {
      const llmResponse = await this.llmClient.generateResponse(prompt);

      const responseMessage = await this.database.message.create({
        data: {
          documentId,
          role: 'ASSISTANT',
          content: llmResponse,
        },
      });

      return responseMessage;

    } catch (error) {
      console.error('❌ LLM error: ', error);
      throw new ServiceUnavailableException('LLM unavailable', { cause: error });
    }
  }

  async list(userId: string, documentId: string, limit?: number, cursor?: string): Promise<MessageListResponseDto> {
    try {
      const document = await this.database.document.findUnique({
        where: { id: documentId },
      });

      if (!document || document.userId !== userId) {
        throw new NotFoundException('Document not found');
      }

      if (limit && limit > 0) {
        limit = Math.min(limit, this.paginationMaxLimit);
      } else {
        limit = this.paginationDefaultLimit;
      }

      let messages = await this.database.message.findMany({
        where: { documentId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
      });

      let nextCursor: string | null = null;
      if (messages.length > limit) {
        messages = messages.slice(0, limit+1);
        const nextMessage = messages.pop();
        nextCursor = nextMessage!.id;
      }

      return {
        data: messages,
        nextCursor,
      }

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2025') {
        throw new BadRequestException('Invalid cursor');
      }

      throw new InternalServerErrorException('Failed to list messages');
    }
  }

  private buildPrompt(ocrText: string, message: string) {
    return `
You are an assistant helping the user understand a document.

Document content:
"""
${ocrText}
"""

User message:
"${message}"

Answer clearly and concisely.
    `;
  }
}
