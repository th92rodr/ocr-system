import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PasswordService } from './password.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<{ token: string }> {
    const hashedPassword = await this.passwordService.hash(password);

    try {
      const user = await this.database.user.create({
        data: { email, password: hashedPassword },
      });

      return {
        token: this.jwtService.sign({ sub: user.id, email }),
      };

    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }

      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    try {
      const user = await this.database.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await this.passwordService.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return {
        token: this.jwtService.sign({ sub: user.id, email }),
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to login');
    }
  }
}
