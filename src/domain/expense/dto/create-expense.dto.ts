import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Category } from 'src/generated/prisma/enums';

export class CreateExpenseDto {
  @IsInt()
  @IsPositive()
  amount: number;

  @IsEnum(Category)
  category: Category;

  @IsOptional()
  @IsString()
  description?: string;

  @IsISO8601()
  date: string;
}
