import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUser: RegisterAuthDto) {
    const response = await this.authService.createUser(registerUser);
    return {
      statusCode: HttpStatus.OK,
      message: 'User created successfully',
      data: response,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const response = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User signed in successfully',
      data: response,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      statusCode: HttpStatus.OK,
      message: 'If the email is registered, a recovery code has been sent',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const response = await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully',
      data: response,
    };
  }
}
