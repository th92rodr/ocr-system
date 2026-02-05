import { Controller, Get, HttpCode, HttpStatus, Param, Post, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiPayloadTooLargeResponse, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest, Response as ExpressResponse} from 'express';

import { DocumentsService } from './documents.service';
import { BadRequestResponseDto, DocumentResponseDto, PayloadTooLargeResponseDto } from './dtos/documents.dto';
import { documentUploadConfig } from './multer/document-upload.config';
import { AuthGuard } from '../auth/auth.guard';
import { InternalServerErrorResponseDto, NotFoundResponseDto } from '../common/dtos/error.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }}}})
  @UseInterceptors(FileInterceptor('file', documentUploadConfig))
  @ApiOperation({ summary: 'Upload new document' })
  @ApiResponse({ status: HttpStatus.CREATED, type: DocumentResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiPayloadTooLargeResponse({ type: PayloadTooLargeResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Request() req: ExpressRequest): Promise<DocumentResponseDto> {
    return this.documentsService.create(file, req.user!.sub);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all documents from the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, type: [DocumentResponseDto] })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async list(@Request() req: ExpressRequest): Promise<DocumentResponseDto[]> {
    return this.documentsService.list(req.user!.sub);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async get(@Param('id') id: string, @Request() req: ExpressRequest): Promise<DocumentResponseDto> {
    return this.documentsService.get(req.user!.sub, id);
  }

  @Get(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download document with extracted text and LLM interactions as a PDF file' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: HttpStatus.OK, content: { 'application/pdf': { schema: { type: 'string', format: 'binary' }}}})
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async download(@Param('id') id: string, @Request() req: ExpressRequest, @Res() res: ExpressResponse) {
    const pdfBuffer = await this.documentsService.generatePdf(req.user!.sub, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="download.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
