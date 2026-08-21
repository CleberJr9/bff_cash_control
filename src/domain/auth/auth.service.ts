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

@Injectable()
export class AuthService {
  constructor(
    private readonly AuthRepository: AuthRepository,
    private readonly JwtService: JwtService,
    @Inject(HashingService)
    private readonly hashService: HashingService,
  ) {}

  async createUser(RegisterAuthDto: RegisterAuthDto) {
    if (!RegisterAuthDto.terms) {
      throw new ConflictException('Terms and conditions not accepted');
    }
    const user = await this.AuthRepository.findByEmail(RegisterAuthDto.email);
    if (user) {
      throw new ConflictException('Email already exists');
    }
    const hash = await this.hashService.hash(RegisterAuthDto.password);
    const newUser = await this.AuthRepository.createUser(
      RegisterAuthDto.name,
      RegisterAuthDto.email,
      hash,
    );
    if (!newUser) {
      throw new InternalServerErrorException('Error creating user');
    }
    const payload = { userName: newUser.name, userId: newUser.id };

    return {
      acessToken: this.JwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    const user = await this.AuthRepository.findByEmail(email);
    if (!user) {
      throw new ConflictException('User not found');
    }
    const isPasswordCorrect = await this.hashService.compare(
      password,
      user.tx_passwordHash,
    );
    if (!isPasswordCorrect) {
      throw new ConflictException('Invalid password');
    }
    const payload = { userName: user.tx_name, userId: user.user_id };
    return {
      acessToken: this.JwtService.sign(payload),
    };
  }
}
