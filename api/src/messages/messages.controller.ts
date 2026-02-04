import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Request, UseGuards, UseFilters } from '@nestjs/common';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import { Request as ExpressRequest} from 'express';

import { MessagesService } from './messages.service';
import { CreateMessageDto, MessageResponseDto, ServiceUnavailableResponseDto, TooEarlyResponseDto } from './dtos/messages.dto';
import { DocumentNotProcessedErrorFilter } from './filters';
import { AuthGuard } from '../auth/auth.guard';
import { InternalServerErrorResponseDto, NotFoundResponseDto } from '../common/dtos/error.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@UseFilters(DocumentNotProcessedErrorFilter)
@Controller('documents/:documentId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send new message' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiResponse({ status: 425, type: TooEarlyResponseDto })
  @ApiServiceUnavailableResponse({ type: ServiceUnavailableResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async create(@Param('documentId') documentId: string, @Body() body: CreateMessageDto, @Request() req: ExpressRequest): Promise<MessageResponseDto> {
    return this.messagesService.create(req.user!.sub, documentId, body.content);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all messages from a document' })
  @ApiResponse({ status: HttpStatus.OK, type: [MessageResponseDto] })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async list(@Param('documentId') documentId: string, @Request() req: ExpressRequest): Promise<MessageResponseDto[]> {
    return this.messagesService.list(req.user!.sub, documentId);
  }
}
