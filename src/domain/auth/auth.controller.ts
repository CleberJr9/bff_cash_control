import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('login')
  // async create(@Body() loginDto: LoginDto, @Res() res: Response) {}

  @Post('register')
  async register(@Body() registerUser: RegisterAuthDto, @Res() res: Response) {
    const response = await this.authService.createUser(registerUser);
    return res.status(HttpStatus.OK).json(response);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return 'login';
  }
}
