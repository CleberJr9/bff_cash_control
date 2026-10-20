import { IsEnum, IsOptional } from 'class-validator';
import { ExpensePeriod } from '../expense-period';

export class ListExpensesQueryDto {
  @IsOptional()
  @IsEnum(ExpensePeriod)
  period: ExpensePeriod = ExpensePeriod.MONTH;
}
