import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { BcryptHashingService } from './hash/bycript.service';
import { HashingService } from './hash/hashing.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    {
      provide: HashingService,
      useClass: BcryptHashingService,
    },
  ],
})
export class AuthModule {}
