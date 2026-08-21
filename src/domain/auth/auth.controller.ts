import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUser: RegisterAuthDto) {
    const response = await this.authService.createUser(registerUser);
    return {
      status: HttpStatus.OK,
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
      status: HttpStatus.OK,
      message: 'User signed in successfully',
      data: response,
    };
  }
}
