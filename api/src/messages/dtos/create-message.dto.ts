import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Explain me the content of this document briefly.' })
  @IsString()
  content: string;
}
