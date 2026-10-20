import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { CurrentUser } from '../auth/jwt/user/current-user.decorator';
import { CurrentUserDto } from '../auth/jwt/user/current-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserDto,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    const data = await this.expenseService.createExpense(
      user.userId,
      createExpenseDto,
    );
    return {
      status: HttpStatus.CREATED,
      message: 'Expense created successfully',
      data,
    };
  }

  @Get()
  async list(
    @CurrentUser() user: CurrentUserDto,
    @Query() query: ListExpensesQueryDto,
  ) {
    const data = await this.expenseService.listByPeriod(
      user.userId,
      query.period,
    );
    return {
      status: HttpStatus.OK,
      message: 'Expenses retrieved successfully',
      data,
    };
  }

  @Get('home')
  async home(@CurrentUser() user: CurrentUserDto) {
    const data = await this.expenseService.getHome(user.userId);
    return {
      status: HttpStatus.OK,
      message: 'Home data retrieved successfully',
      data,
    };
  }
}
