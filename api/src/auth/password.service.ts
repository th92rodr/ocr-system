import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;
  private readonly pepper: string;

  constructor(private readonly config: ConfigService) {
    this.pepper = config.get<string>('PASSWORD_PEPPER')!;
  }

  async hash(password: string): Promise<string> {
    return hash(password + this.pepper, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password + this.pepper, hashedPassword);
  }
}
