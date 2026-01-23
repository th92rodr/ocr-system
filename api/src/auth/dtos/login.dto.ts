import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password1234' })
  @IsString()
  @Length(8, 32)
  password: string;
}
