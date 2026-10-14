import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { AuthRepository } from './auth.repository';
import { HashingService } from './hash/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { AppLogger } from 'src/shared/logger/logger.service';
import { MailService } from 'src/shared/mail/mail.service';

const RESET_CODE_TTL_MINUTES = 15;
const RESET_CODE_MAX_ATTEMPTS = 5;

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] as string,
  );

@Injectable()
export class AuthService {
  constructor(
    private readonly AuthRepository: AuthRepository,
    private readonly JwtService: JwtService,
    @Inject(HashingService)
    private readonly hashService: HashingService,
    private readonly logger: AppLogger,
    private readonly mailService: MailService,
  ) {}

  async createUser(RegisterAuthDto: RegisterAuthDto) {
    this.logger.info(
      {
        operationName: 'createUser',
        email: RegisterAuthDto.email,
        name: RegisterAuthDto.name,
      },
      'Iniciando a criação do usuário',
    );
    const user = await this.AuthRepository.findByEmail(RegisterAuthDto.email);
    if (user) {
      this.logger.warn(
        {
          operationName: 'createUser',
          email: RegisterAuthDto.email,
          name: RegisterAuthDto.name,
        },
        'O email já está sendo usado por outro usuário',
      );
      throw new ConflictException('Email already exists');
    }
    const hash = await this.hashService.hash(RegisterAuthDto.password);
    const newUser = await this.AuthRepository.createUser(
      RegisterAuthDto.name,
      RegisterAuthDto.email,
      hash,
    );
    if (!newUser) {
      this.logger.warn(
        {
          operationName: 'createUser',
          email: RegisterAuthDto.email,
          name: RegisterAuthDto.name,
        },
        'erro ao criar um novo usuário',
      );
      throw new InternalServerErrorException('Error creating user');
    }
    const payload = { userName: newUser.name, userId: newUser.id };
    this.logger.info(
      {
        operationName: 'createUser',
        email: RegisterAuthDto.email,
        name: RegisterAuthDto.name,
      },
      'Criação do usuário bem sucedida',
    );
    return {
      accessToken: this.JwtService.sign(payload),
      nameUser: newUser.name,
    };
  }

  async login(email: string, password: string) {
    this.logger.info(
      {
        operationName: 'login',
        email,
      },
      'Iniciando o login',
    );
    const user = await this.AuthRepository.findByEmail(email);
    if (!user) {
      throw new ConflictException('User not found');
    }
    const isPasswordCorrect = await this.hashService.compare(
      password,
      user.tx_passwordHash,
    );
    if (!isPasswordCorrect) {
      this.logger.warn(
        {
          operationName: 'login',
          email,
        },
        'Credenciais incorretas',
      );
      throw new ConflictException('Invalid credentials');
    }
    const payload = { userName: user.tx_name, userId: user.user_id };
    this.logger.info(
      {
        operationName: 'login',
        email,
      },
      'Login bem sucedido',
    );
    return {
      accessToken: this.JwtService.sign(payload),
      nameUser: user.tx_name,
    };
  }

  async forgotPassword(email: string) {
    this.logger.info(
      { operationName: 'forgotPassword', email },
      'Iniciando a recuperação de senha',
    );
    const user = await this.AuthRepository.findByEmail(email);
    if (!user) {
      // Não revela se o email existe: o cliente sempre recebe a mesma resposta
      this.logger.warn(
        { operationName: 'forgotPassword', email },
        'Recuperação solicitada para email não cadastrado',
      );
      return;
    }
    await this.AuthRepository.invalidatePasswordResets(user.user_id);
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await this.hashService.hash(code);
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60_000);
    await this.AuthRepository.createPasswordReset(
      user.user_id,
      codeHash,
      expiresAt,
    );
    try {
      await this.mailService.send({
        to: user.tx_email,
        subject: 'Cash Control - Código de recuperação de senha',
        text: `Olá, ${user.tx_name}! Seu código de recuperação de senha é ${code}. Ele expira em ${RESET_CODE_TTL_MINUTES} minutos.`,
        html: `
          <p>Olá, ${escapeHtml(user.tx_name)}!</p>
          <p>Seu código de recuperação de senha é:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
          <p>Ele expira em ${RESET_CODE_TTL_MINUTES} minutos. Se você não pediu a recuperação, ignore este email.</p>
        `,
      });
    } catch (e) {
      this.logger.error(
        { operationName: 'forgotPassword', email, error: (e as Error).message },
        'Erro ao enviar email de recuperação de senha',
      );
      throw new InternalServerErrorException('Error sending email');
    }
    this.logger.info(
      { operationName: 'forgotPassword', email },
      'Código de recuperação enviado',
    );
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    this.logger.info(
      { operationName: 'resetPassword', email },
      'Iniciando a redefinição de senha',
    );
    const user = await this.AuthRepository.findByEmail(email);
    const passwordReset = user
      ? await this.AuthRepository.findActivePasswordReset(user.user_id)
      : null;
    if (
      !user ||
      !passwordReset ||
      passwordReset.num_attempts >= RESET_CODE_MAX_ATTEMPTS
    ) {
      this.logger.warn(
        { operationName: 'resetPassword', email },
        'Nenhum código válido para o usuário',
      );
      throw new BadRequestException('Invalid or expired code');
    }
    const isCodeCorrect = await this.hashService.compare(
      code,
      passwordReset.tx_codeHash,
    );
    if (!isCodeCorrect) {
      await this.AuthRepository.incrementPasswordResetAttempts(
        passwordReset.passwordReset_id,
      );
      this.logger.warn(
        {
          operationName: 'resetPassword',
          email,
          attempts: passwordReset.num_attempts + 1,
        },
        'Código de recuperação incorreto',
      );
      throw new BadRequestException('Invalid or expired code');
    }
    const passwordHash = await this.hashService.hash(newPassword);
    await this.AuthRepository.updatePasswordWithReset(
      user.user_id,
      passwordReset.passwordReset_id,
      passwordHash,
    );
    const payload = { userName: user.tx_name, userId: user.user_id };
    this.logger.info(
      { operationName: 'resetPassword', email },
      'Senha redefinida com sucesso',
    );
    return {
      accessToken: this.JwtService.sign(payload),
      nameUser: user.tx_name,
    };
  }
}
