import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { ErrorResponseDto } from '../../common/dtos/error.dto';

export class CreateMessageDto {
  @ApiProperty({ example: 'Explain me the content of this document briefly.' })
  @IsString()
  content: string;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT'] })
  role: 'USER' | 'ASSISTANT';

  @ApiProperty()
  createdAt: Date;
}

export class TooEarlyResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 425 })
  statusCode: number;

  @ApiProperty({ example: 'TooEarly' })
  error: string;

  @ApiProperty({ example: 'Document not processed yet' })
  message: string;
}

export class ServiceUnavailableResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 503 })
  statusCode: number;

  @ApiProperty({ example: 'ServiceUnavailable' })
  error: string;

  @ApiProperty({ example: 'LLM unavailable' })
  message: string;
}
