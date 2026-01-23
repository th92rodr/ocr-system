import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthController validation', () => {
  let app: INestApplication;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
    .overrideGuard(AuthGuard).useValue(mockAuthGuard)
    .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register validation', () => {
    it('should succeed', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: '123456789',
        })
        .expect(201);
    });

    it('should fail when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: '123456789',
        })
        .expect(400);
    });

    it('should fail when password is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: '123',
        })
        .expect(400);
    });

    it('should fail when fields are missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/login validation', () => {
    it('should succeed', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: '123456789',
        })
        .expect(200);
    });

    it('should fail when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: '123456789',
        })
        .expect(400);
    });

    it('should fail when password is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: '123',
        })
        .expect(400);
    });

    it('should fail when fields are missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
});
