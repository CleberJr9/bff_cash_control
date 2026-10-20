import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Category } from 'src/generated/prisma/enums';
import { Expense } from 'src/generated/prisma/client';

export type UserBudgetInfo = {
  name: string;
  monthlyBudget: number;
};

export type CreateExpenseData = {
  amount: number;
  category: Category;
  title: string;
  description?: string;
  date: Date;
};

@Injectable()
export class ExpenseRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserBudgetInfo(userId: string): Promise<UserBudgetInfo | null> {
    const user = await this.prismaService.user.findFirst({
      where: { user_id: userId },
      select: { tx_name: true, num_monthlyBudget: true },
    });
    if (!user) {
      return null;
    }
    return { name: user.tx_name, monthlyBudget: user.num_monthlyBudget };
  }

  async findSince(userId: string, from: Date): Promise<Expense[]> {
    return this.prismaService.expense.findMany({
      where: { userId, dt_date: { gte: from } },
      orderBy: { dt_date: 'asc' },
    });
  }

  async findRecent(userId: string, take: number): Promise<Expense[]> {
    return this.prismaService.expense.findMany({
      where: { userId },
      orderBy: { dt_date: 'desc' },
      take,
    });
  }

  async create(userId: string, data: CreateExpenseData): Promise<Expense> {
    return this.prismaService.expense.create({
      data: {
        userId,
        num_amount: data.amount,
        enum_category: data.category,
        tx_title: data.title,
        tx_description: data.description,
        dt_date: data.date,
      },
    });
  }
}
