/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { HashingService } from './hash/hashing.service';
import { AppLogger } from 'src/shared/logger/logger.service';
import { MailService } from 'src/shared/mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  let hashService: jest.Mocked<HashingService>;
  let mailService: jest.Mocked<MailService>;

  const user = {
    user_id: 'user-1',
    tx_name: 'Cleber',
    tx_email: 'cleber@email.com',
    tx_passwordHash: 'old-hash',
  };
  const passwordReset = {
    passwordReset_id: 'reset-1',
    tx_codeHash: 'code-hash',
    num_attempts: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            findbyId: jest.fn(),
            createUser: jest.fn(),
            invalidatePasswordResets: jest.fn(),
            createPasswordReset: jest.fn(),
            findActivePasswordReset: jest.fn(),
            incrementPasswordResetAttempts: jest.fn(),
            updatePasswordWithReset: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token') },
        },
        {
          provide: HashingService,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { send: jest.fn() },
        },
        {
          provide: AppLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(AuthRepository);
    hashService = module.get(HashingService);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should return accessToken and nameUser', async () => {
      repository.findByEmail.mockResolvedValue(null);
      hashService.hash.mockResolvedValue('hash');
      repository.createUser.mockResolvedValue({
        id: 'user-1',
        name: 'Cleber',
        email: 'cleber@email.com',
      });

      const result = await service.createUser({
        name: 'Cleber',
        email: 'cleber@email.com',
        password: 'Senha@123',
      });

      expect(result).toEqual({ accessToken: 'token', nameUser: 'Cleber' });
    });
  });

  describe('forgotPassword', () => {
    it('should not send email when user does not exist', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nobody@email.com'),
      ).resolves.toBeUndefined();
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('should invalidate old codes, store hashed code and send it', async () => {
      repository.findByEmail.mockResolvedValue(user as never);
      hashService.hash.mockResolvedValue('code-hash');

      await service.forgotPassword(user.tx_email);

      expect(repository.invalidatePasswordResets).toHaveBeenCalledWith(
        user.user_id,
      );
      const code = hashService.hash.mock.calls[0][0];
      expect(code).toMatch(/^\d{6}$/);
      expect(repository.createPasswordReset).toHaveBeenCalledWith(
        user.user_id,
        'code-hash',
        expect.any(Date),
      );
      const mail = mailService.send.mock.calls[0][0];
      expect(mail.to).toBe(user.tx_email);
      expect(mail.html).toContain(code);
    });

    it('should throw when email sending fails', async () => {
      repository.findByEmail.mockResolvedValue(user as never);
      mailService.send.mockRejectedValue(new Error('smtp down'));

      await expect(service.forgotPassword(user.tx_email)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return accessToken and nameUser', async () => {
      repository.findByEmail.mockResolvedValue(user as never);
      repository.findActivePasswordReset.mockResolvedValue(
        passwordReset as never,
      );
      hashService.compare.mockResolvedValue(true);
      hashService.hash.mockResolvedValue('new-hash');

      const result = await service.resetPassword(
        user.tx_email,
        '123456',
        'Nova@1234',
      );

      expect(repository.updatePasswordWithReset).toHaveBeenCalledWith(
        user.user_id,
        passwordReset.passwordReset_id,
        'new-hash',
      );
      expect(result).toEqual({ accessToken: 'token', nameUser: 'Cleber' });
    });

    it('should increment attempts when code is wrong', async () => {
      repository.findByEmail.mockResolvedValue(user as never);
      repository.findActivePasswordReset.mockResolvedValue(
        passwordReset as never,
      );
      hashService.compare.mockResolvedValue(false);

      await expect(
        service.resetPassword(user.tx_email, '000000', 'Nova@1234'),
      ).rejects.toThrow(BadRequestException);
      expect(repository.incrementPasswordResetAttempts).toHaveBeenCalledWith(
        passwordReset.passwordReset_id,
      );
      expect(repository.updatePasswordWithReset).not.toHaveBeenCalled();
    });

    it('should reject when max attempts reached', async () => {
      repository.findByEmail.mockResolvedValue(user as never);
      repository.findActivePasswordReset.mockResolvedValue({
        ...passwordReset,
        num_attempts: 5,
      } as never);

      await expect(
        service.resetPassword(user.tx_email, '123456', 'Nova@1234'),
      ).rejects.toThrow(BadRequestException);
      expect(hashService.compare).not.toHaveBeenCalled();
    });

    it('should reject when there is no active code', async () => {
      repository.findByEmail.mockResolvedValue(user as never);
      repository.findActivePasswordReset.mockResolvedValue(null);

      await expect(
        service.resetPassword(user.tx_email, '123456', 'Nova@1234'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
