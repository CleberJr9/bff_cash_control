import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Category } from 'src/generated/prisma/enums';

export class CreateExpenseDto {
  @IsInt()
  @IsPositive()
  amount: number;

  @IsEnum(Category)
  category: Category;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsISO8601()
  date: string;
}
