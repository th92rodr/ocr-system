import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { ErrorResponseDto } from '../../common/dtos/error.dto';

export class CreateMessageDto {
  @ApiProperty({ example: 'Explain me the content of this document briefly.' })
  @IsString()
  content: string;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional({ description: 'Number of messages to return', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor for pagination', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  documentId: string;

  @ApiProperty({ example: 'This document is an invoice ...' })
  content: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT'], example: 'ASSISTANT' })
  role: 'USER' | 'ASSISTANT';

  @ApiProperty()
  createdAt: Date;
}

export class MessageListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  data: MessageResponseDto[];

  @ApiProperty({ nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  nextCursor: string | null;
}

export class MessagesBadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'BadRequest' })
  error: string;

  @ApiProperty({ example: 'Invalid cursor' })
  message: string;
}

export class MessagesTooEarlyResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 425 })
  statusCode: number;

  @ApiProperty({ example: 'TooEarly' })
  error: string;

  @ApiProperty({ example: 'Document not processed yet' })
  message: string;
}

export class MessagesServiceUnavailableResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 503 })
  statusCode: number;

  @ApiProperty({ example: 'ServiceUnavailable' })
  error: string;

  @ApiProperty({ example: 'LLM unavailable' })
  message: string;
}
