import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    const user = await this.database.user.create({
      data: { email, password: hashedPassword },
    });

    return {
      token: this.jwtService.sign({ sub: user.id, email }),
    };
  }

  async login(email: string, password: string): Promise<{ token: string }> {
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
  }
}
