import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { PrismaService } from '../database/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockDatabaseService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockPasswordService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDatabaseService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password, create user and return token', async () => {
      const email = 'test@test.com';
      const password = '123456789';
      const hashedPassword = 'test-hashed-password';
      const userId = 'test-user-id';
      const token = 'test-token';

      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockDatabaseService.user.create.mockResolvedValue(
        { id: userId, email, password: hashedPassword });
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(email, password);

      expect(mockPasswordService.hash).toHaveBeenCalledWith(password);
      expect(mockDatabaseService.user.create).toHaveBeenCalledWith({
        data: { email, password: hashedPassword },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId, email });
      expect(result).toEqual({ token });
    });
  });

  describe('login', () => {
    const email = 'test@test.com';
    const password = '123456789';
    const hashedPassword = 'test-hashed-password';
    const userId = 'test-user-id';
    const token = 'test-token';
    const invalidPassword = 'wrong-password';

    it('should return token if credentials are valid', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue({
        id: userId, email, password: hashedPassword,
      });
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(email, password);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId, email });
      expect(result).toEqual({ token });
    });


    it('should throw UnauthorizedException if user not found', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(email, password),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue({
        id: userId, email, password: hashedPassword,
      });
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        service.login(email, invalidPassword),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockPasswordService.compare).toHaveBeenCalledWith(invalidPassword, hashedPassword);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
