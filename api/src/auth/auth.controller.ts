import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { AuthDto, AuthResponseDto, ConflictResponseDto, UnauthorizedResponseDto } from './dtos/auth.dto';
import { InternalServerErrorResponseDto } from '../common/dtos/error.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async register(@Body() body: AuthDto): Promise<AuthResponseDto> {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiInternalServerErrorResponse({ type: InternalServerErrorResponseDto })
  async login(@Body() body: AuthDto): Promise<AuthResponseDto> {
    return this.authService.login(body.email, body.password);
  }
}
