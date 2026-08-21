import {
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

@Injectable()
export class AuthService {
  constructor(
    private readonly AuthRepository: AuthRepository,
    private readonly JwtService: JwtService,
    @Inject(HashingService)
    private readonly hashService: HashingService,
    private readonly logger: AppLogger,
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
    if (!RegisterAuthDto.terms) {
      this.logger.warn(
        {
          operationName: 'createUser',
          email: RegisterAuthDto.email,
          name: RegisterAuthDto.name,
        },
        'Não foi aceito os termos e condições',
      );
      throw new ConflictException('Terms and conditions not accepted');
    }
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
      acessToken: this.JwtService.sign(payload),
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
      acessToken: this.JwtService.sign(payload),
    };
  }
}
