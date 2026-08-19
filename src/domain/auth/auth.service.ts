import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { AuthRepository } from './auth.repository';
import { HashingService } from './hash/hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly AuthRepository: AuthRepository,
    @Inject(HashingService)
    private readonly hashService: HashingService,
  ) {}

  async createUser(RegisterAuthDto: RegisterAuthDto): Promise<void> {
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
  }
}
