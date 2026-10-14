import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from './is-strong-password.decorator';

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsStrongPassword()
  password: string;
}
