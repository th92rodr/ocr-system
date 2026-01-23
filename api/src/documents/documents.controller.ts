import { Controller, Get, HttpCode, HttpStatus, Param, Post, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Request as ExpressRequest, Response as ExpressResponse} from 'express';

import { DocumentsService } from './documents.service';
import { documentUploadConfig } from './multer/document-upload.config';
import { AuthGuard } from '../auth/auth.guard';

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
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Request() req: ExpressRequest) {
    return this.documentsService.create(file, req.user!.sub);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Request() req: ExpressRequest) {
    return this.documentsService.list(req.user!.sub);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async get(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.documentsService.get(req.user!.sub, id);
  }

  @Get(':id/download')
  @HttpCode(HttpStatus.OK)
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
