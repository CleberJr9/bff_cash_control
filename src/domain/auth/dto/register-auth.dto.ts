import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsEmail()
  @IsString()
  email: string;
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula',
  })
  @Matches(/[0-9]/, {
    message: 'A senha deve conter pelo menos um número',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'A senha deve conter pelo menos um caractere especial',
  })
  password: string;

  @IsBoolean()
  terms: boolean;
}
