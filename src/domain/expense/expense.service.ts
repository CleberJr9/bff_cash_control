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
  monthNamePtBr,
  startOfAggregationWindow,
  ExpensePoint,
  toDateKey,
} from './home-aggregation';
import {
  ExpensePeriod,
  formatGroupDate,
  groupByPeriod,
  periodRange,
} from './expense-period';

const RECENT_TRANSACTIONS_LIMIT = 10;

// Valores são agregados em centavos (inteiros) e convertidos para reais só na resposta.
function centsToReais(cents: number): number {
  return cents / 100;
}

function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function withAmountInReais<T extends { amount: number }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, amount: centsToReais(item.amount) }));
}

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
      title: dto.title,
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

    const daily = buildDailyBuckets(now, points);
    const weekly = buildWeeklyBuckets(now, points);
    const monthly = buildMonthlyBuckets(now, points);
    const spentThisMonth = monthly[monthly.length - 1].amount;

    return {
      user: { name: userInfo.name },
      budget: {
        monthlyBudget: centsToReais(userInfo.monthlyBudget),
        spentThisMonth: centsToReais(spentThisMonth),
        currentMonth: monthNamePtBr(now),
      },
      chart: {
        daily: withAmountInReais(daily),
        weekly: withAmountInReais(weekly),
        monthly: withAmountInReais(monthly),
        totals: {
          daily: centsToReais(sumAmounts(daily)),
          weekly: centsToReais(sumAmounts(weekly)),
          monthly: centsToReais(sumAmounts(monthly)),
        },
      },
      byCategory: withAmountInReais(buildCategoryTotals(now, points)),
      transactions: recent.map((expense) => this.toTransaction(expense)),
    };
  }

  async listByPeriod(
    userId: string,
    period: ExpensePeriod,
    now: Date = new Date(),
  ) {
    const { start, end } = periodRange(now, period);
    const expenses = await this.expenseRepository.findBetween(
      userId,
      start,
      end,
    );

    const groups = groupByPeriod(
      expenses.map((expense) => ({
        amount: expense.num_amount,
        date: expense.dt_date,
        expense,
      })),
      period,
    );
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.num_amount,
      0,
    );

    return {
      period,
      startDate: toDateKey(start),
      endDate: toDateKey(end),
      count: expenses.length,
      totalAmount: centsToReais(totalAmount),
      groups: groups.map((group) => ({
        date: formatGroupDate(group.key, period),
        sumAmount: centsToReais(group.sumAmount),
        expenses: group.items.map((item) => this.toTransaction(item.expense)),
      })),
    };
  }

  private toTransaction(expense: Expense) {
    return {
      id: expense.expense_id,
      category: expense.enum_category,
      title: expense.tx_title,
      description: expense.tx_description,
      amount: centsToReais(expense.num_amount),
      date: expense.dt_date.toISOString().slice(0, 10),
      createdAt: expense.dt_createdAt.toISOString(),
    };
  }
}
