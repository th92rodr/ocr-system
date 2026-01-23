import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Message } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import { LLMClient } from './llm/llm.client';
import { DocumentNotProcessedError } from './errors';

@Injectable()
export class MessagesService {
  constructor(
    private readonly database: PrismaService,
    private readonly llmClient: LLMClient,
  ) {}

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

    const message = await this.database.message.create({
      data: {
        documentId,
        role: 'USER',
        content,
      },
    });

    const prompt = this.buildPrompt(document.ocr.text, message.content);

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

  async list(userId: string, documentId: string): Promise<Message[]> {
    const document = await this.database.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.userId !== userId) {
      throw new NotFoundException('Document not found');
    }

    return this.database.message.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
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
