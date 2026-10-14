import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { IsStrongPassword } from './is-strong-password.decorator';

export class ResetPasswordDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @Matches(/^\d{6}$/, { message: 'O código deve ter 6 dígitos' })
  code: string;
  @IsStrongPassword()
  newPassword: string;
}
