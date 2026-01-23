import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dtos/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

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

    controller = moduleRef.get(AuthController);
    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call AuthService.register with the required params', async () => {
      const body: LoginDto = { email: 'test@test.com', password: '123456789' };

      const token = { token: 'test-token' };
      mockAuthService.register.mockResolvedValue(token);

      const response = await controller.register(body);

      expect(service.register).toHaveBeenCalledWith(body.email, body.password);
      expect(response).toEqual(token);
    });
  });

  describe('login', () => {
    it('should call AuthService.login with the required params', async () => {
      const body: LoginDto = { email: 'test@test.com', password: '123456789' };

      const token = { token: 'test-token' };
      mockAuthService.login.mockResolvedValue(token);

      const response = await controller.login(body);

      expect(service.login).toHaveBeenCalledWith(body.email, body.password);
      expect(response).toEqual(token);
    });
  });
});
