import { BadRequestException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import multer from 'multer';

export const documentUploadConfig: multer.Options = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req: ExpressRequest, file: Express.Multer.File, callback: Function) => {
    if (!file.mimetype.match(/\/(pdf|jpeg|png|jpg)$/)) {
      return callback(new BadRequestException('Invalid file type. The supported files are: image/jpeg, image/png, application/pdf'), false);
    }
    return callback(null, true);
  },
};
