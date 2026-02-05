import { ApiProperty } from '@nestjs/swagger';

import { ErrorResponseDto } from '../../common/dtos/error.dto';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty({ enum: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export class BadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'BadRequest' })
  error: string;

  @ApiProperty({ example: ['File is required', 'Invalid file type. The supported files are: image/jpeg, image/png, application/pdf'] })
  message: string;
}

export class PayloadTooLargeResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 413 })
  statusCode: number;

  @ApiProperty({ example: 'PayloadTooLarge' })
  error: string;

  @ApiProperty({ example: 'File too large' })
  message: string;
}
