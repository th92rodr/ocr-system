import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  statusCode: number;
  error: string;
  message: string;
}

export class NotFoundResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'NotFound' })
  error: string;

  @ApiProperty({ example: 'Document not found' })
  message: string;
}

export class InternalServerErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 500 })
  statusCode: number;

  @ApiProperty({ example: 'InternalServerError' })
  error: string;

  @ApiProperty({ example: 'Operation failed' })
  message: string;
}
