import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Request, UseGuards, UseFilters } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import { Request as ExpressRequest} from 'express';

import { MessagesService } from './messages.service';
import { CreateMessageDto, ListMessagesQueryDto, MessageListResponseDto, MessageResponseDto, MessagesBadRequestResponseDto, MessagesServiceUnavailableResponseDto, MessagesTooEarlyResponseDto } from './dtos/messages.dto';
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
  @ApiParam({ name: 'documentId', description: 'Document ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ type: MessageResponseDto, description: 'LLM response message' })
  @ApiNotFoundResponse({ type: NotFoundResponseDto, description: 'Document not found' })
  @ApiResponse({ status: 425, type: MessagesTooEarlyResponseDto, description: 'Document is still being processed' })
  @ApiServiceUnavailableResponse({ type: MessagesServiceUnavailableResponseDto, description: 'LLM service is unavailable' })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async create(
    @Request() req: ExpressRequest,
    @Param('documentId') documentId: string,
    @Body() body: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.create(req.user!.sub, documentId, body.content);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all messages from a document' })
  @ApiParam({ name: 'documentId', description: 'Document ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiOkResponse({ type: MessageListResponseDto, description: 'Paginated list of messages' })
  @ApiNotFoundResponse({ type: NotFoundResponseDto, description: 'Document not found' })
  @ApiBadRequestResponse({ type: MessagesBadRequestResponseDto, description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async list(
    @Request() req: ExpressRequest,
    @Param('documentId') documentId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageListResponseDto> {
    return this.messagesService.list(req.user!.sub, documentId, query.limit, query.cursor);
  }
}
