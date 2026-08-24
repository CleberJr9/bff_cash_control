import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { AppLogger } from 'src/shared/logger/logger.service';
import { Expense } from 'src/generated/prisma/client';
import {
  buildCategoryTotals,
  buildDailyBuckets,
  buildMonthlyBuckets,
  buildWeeklyBuckets,
  startOfAggregationWindow,
  ExpensePoint,
} from './home-aggregation';

const RECENT_TRANSACTIONS_LIMIT = 10;

@Injectable()
export class ExpenseService {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly logger: AppLogger,
  ) {}

  async createExpense(userId: string, dto: CreateExpenseDto) {
    this.logger.info(
      { operationName: 'createExpense', userId },
      'Criando nova despesa',
    );
    const expense = await this.expenseRepository.create(userId, {
      amount: dto.amount,
      category: dto.category,
      description: dto.description,
      date: new Date(dto.date),
    });
    return this.toTransaction(expense);
  }

  async getHome(userId: string, now: Date = new Date()) {
    const userInfo = await this.expenseRepository.findUserBudgetInfo(userId);
    if (!userInfo) {
      throw new NotFoundException('User not found');
    }

    const [expenses, recent] = await Promise.all([
      this.expenseRepository.findSince(userId, startOfAggregationWindow(now)),
      this.expenseRepository.findRecent(userId, RECENT_TRANSACTIONS_LIMIT),
    ]);

    const points: ExpensePoint[] = expenses.map((expense) => ({
      amount: expense.num_amount,
      category: expense.enum_category,
      date: expense.dt_date,
    }));

    const monthly = buildMonthlyBuckets(now, points);
    const spentThisMonth = monthly[monthly.length - 1].amount;

    return {
      user: { name: userInfo.name },
      budget: {
        monthlyBudget: userInfo.monthlyBudget,
        spentThisMonth,
      },
      chart: {
        daily: buildDailyBuckets(now, points),
        weekly: buildWeeklyBuckets(now, points),
        monthly,
      },
      byCategory: buildCategoryTotals(now, points),
      transactions: recent.map((expense) => this.toTransaction(expense)),
    };
  }

  private toTransaction(expense: Expense) {
    return {
      id: expense.expense_id,
      category: expense.enum_category,
      description: expense.tx_description,
      amount: expense.num_amount,
      date: expense.dt_date.toISOString().slice(0, 10),
    };
  }
}
