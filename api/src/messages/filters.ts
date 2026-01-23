import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

import { DocumentNotProcessedError } from './errors';

@Catch(DocumentNotProcessedError)
export class DocumentNotProcessedErrorFilter implements ExceptionFilter {
  catch(exception: DocumentNotProcessedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(425).json({
      statusCode: 425,
      message: exception.message,
    });
  }
}
