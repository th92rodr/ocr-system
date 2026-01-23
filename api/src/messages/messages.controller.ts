import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Request, UseGuards, UseFilters } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest} from 'express';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { DocumentNotProcessedErrorFilter } from './filters';
import { AuthGuard } from '../auth/auth.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@UseFilters(DocumentNotProcessedErrorFilter)
@Controller('documents/:documentId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Param('documentId') documentId: string, @Body() body: CreateMessageDto, @Request() req: ExpressRequest) {
    return this.messagesService.create(req.user!.sub, documentId, body.content);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Param('documentId') documentId: string, @Request() req: ExpressRequest) {
    return this.messagesService.list(req.user!.sub, documentId);
  }
}
