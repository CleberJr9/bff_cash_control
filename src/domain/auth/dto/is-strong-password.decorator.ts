import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';

export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8),
    Matches(/[A-Z]/, {
      message: 'A senha deve conter pelo menos uma letra maiúscula',
    }),
    Matches(/[0-9]/, {
      message: 'A senha deve conter pelo menos um número',
    }),
    Matches(/[^A-Za-z0-9]/, {
      message: 'A senha deve conter pelo menos um caractere especial',
    }),
  );
}
