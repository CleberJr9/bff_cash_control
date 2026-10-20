import { NotFoundException } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './expense.repository';
import { AppLogger } from 'src/shared/logger/logger.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensePeriod } from './expense-period';

describe('ExpenseService', () => {
  const now = new Date(Date.UTC(2026, 7, 23)); // 2026-08-23

  let repository: jest.Mocked<ExpenseRepository>;
  let logger: jest.Mocked<AppLogger>;
  let service: ExpenseService;

  beforeEach(() => {
    repository = {
      findUserBudgetInfo: jest.fn(),
      findSince: jest.fn(),
      findRecent: jest.fn(),
      findBetween: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ExpenseRepository>;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new ExpenseService(repository, logger);
  });

  describe('getHome', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      repository.findUserBudgetInfo.mockResolvedValue(null);

      await expect(service.getHome('user-1', now)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('assembles user, budget, chart, byCategory and transactions with amounts in reais', async () => {
      const expense = {
        expense_id: 'e1',
        num_amount: 1050,
        enum_category: 'FOOD',
        tx_title: 'Restaurante',
        tx_description: 'Almoço',
        dt_date: new Date('2026-08-23T00:00:00.000Z'),
        userId: 'user-1',
        dt_createdAt: now,
        dt_updatedAt: now,
      };
      repository.findUserBudgetInfo.mockResolvedValue({
        name: 'Ana',
        monthlyBudget: 50000,
      });
      const julyExpense = {
        ...expense,
        expense_id: 'e0',
        num_amount: 2000,
        dt_date: new Date('2026-07-10T00:00:00.000Z'),
      };
      repository.findSince.mockResolvedValue([julyExpense, expense] as never);
      repository.findRecent.mockResolvedValue([expense] as never);

      const result = await service.getHome('user-1', now);

      /* eslint-disable @typescript-eslint/unbound-method */
      expect(repository.findSince).toHaveBeenCalledWith(
        'user-1',
        new Date(Date.UTC(2026, 2, 1)),
      );
      expect(repository.findRecent).toHaveBeenCalledWith('user-1', 10);
      /* eslint-enable @typescript-eslint/unbound-method */
      expect(result.user).toEqual({ name: 'Ana' });
      expect(result.budget).toEqual({
        monthlyBudget: 500,
        spentThisMonth: 10.5,
        currentMonth: 'Agosto',
      });
      expect(result.chart.monthly[5]).toEqual({
        date: '2026-08-01',
        label: 'Ago',
        amount: 10.5,
      });
      expect(result.chart.totals).toEqual({
        daily: 10.5,
        weekly: 10.5,
        monthly: 30.5,
      });
      expect(result.byCategory).toContainEqual({
        category: 'FOOD',
        amount: 10.5,
      });
      expect(result.transactions).toEqual([
        {
          id: 'e1',
          category: 'FOOD',
          title: 'Restaurante',
          description: 'Almoço',
          amount: 10.5,
          date: '2026-08-23',
          createdAt: now.toISOString(),
        },
      ]);
    });
  });

  describe('createExpense', () => {
    it('creates the expense through the repository and returns it mapped with amount in reais', async () => {
      repository.create.mockResolvedValue({
        expense_id: 'e2',
        num_amount: 500,
        enum_category: 'TRANSPORT',
        tx_title: 'Uber',
        tx_description: null,
        dt_date: new Date('2026-08-20T00:00:00.000Z'),
        userId: 'user-1',
        dt_createdAt: now,
        dt_updatedAt: now,
      } as never);

      const dto: CreateExpenseDto = {
        amount: 500,
        category: 'TRANSPORT',
        title: 'Uber',
        date: '2026-08-20',
      };

      const result = await service.createExpense('user-1', dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith('user-1', {
        amount: 500,
        category: 'TRANSPORT',
        title: 'Uber',
        description: undefined,
        date: new Date('2026-08-20'),
      });
      expect(result).toEqual({
        id: 'e2',
        category: 'TRANSPORT',
        title: 'Uber',
        description: null,
        amount: 5,
        date: '2026-08-20',
        createdAt: now.toISOString(),
      });
    });
  });

  describe('listByPeriod', () => {
    const makeExpense = (id: string, amount: number, date: string) => ({
      expense_id: id,
      num_amount: amount,
      enum_category: 'FOOD',
      tx_title: `Gasto ${id}`,
      tx_description: null,
      dt_date: new Date(`${date}T00:00:00.000Z`),
      userId: 'user-1',
      dt_createdAt: now,
      dt_updatedAt: now,
    });

    it('queries the period range and returns expenses grouped by day with totals in reais', async () => {
      repository.findBetween.mockResolvedValue([
        makeExpense('e1', 1000, '2026-08-23'),
        makeExpense('e2', 550, '2026-08-23'),
        makeExpense('e3', 2000, '2026-08-18'),
      ] as never);

      const result = await service.listByPeriod(
        'user-1',
        ExpensePeriod.WEEK,
        now,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findBetween).toHaveBeenCalledWith(
        'user-1',
        new Date(Date.UTC(2026, 7, 17)),
        new Date(Date.UTC(2026, 7, 23)),
      );
      expect(result.period).toBe('week');
      expect(result.startDate).toBe('2026-08-17');
      expect(result.endDate).toBe('2026-08-23');
      expect(result.count).toBe(3);
      expect(result.totalAmount).toBe(35.5);
      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].date).toBe('23 Ago');
      expect(result.groups[0].sumAmount).toBe(15.5);
      expect(result.groups[0].expenses.map((e) => e.id)).toEqual(['e1', 'e2']);
      expect(result.groups[0].expenses[0]).toEqual({
        id: 'e1',
        category: 'FOOD',
        title: 'Gasto e1',
        description: null,
        amount: 10,
        date: '2026-08-23',
        createdAt: now.toISOString(),
      });
      expect(result.groups[1]).toMatchObject({
        date: '18 Ago',
        sumAmount: 20,
      });
    });

    it('returns a single month group for the month period', async () => {
      repository.findBetween.mockResolvedValue([
        makeExpense('e1', 1000, '2026-08-23'),
        makeExpense('e2', 2000, '2026-08-02'),
      ] as never);

      const result = await service.listByPeriod(
        'user-1',
        ExpensePeriod.MONTH,
        now,
      );

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]).toMatchObject({
        date: 'Ago 2026',
        sumAmount: 30,
      });
      expect(result.groups[0].expenses.map((e) => e.id)).toEqual(['e1', 'e2']);
    });

    it('returns empty groups and zero totals when there are no expenses', async () => {
      repository.findBetween.mockResolvedValue([]);

      const result = await service.listByPeriod(
        'user-1',
        ExpensePeriod.DAY,
        now,
      );

      expect(result).toEqual({
        period: 'day',
        startDate: '2026-08-23',
        endDate: '2026-08-23',
        count: 0,
        totalAmount: 0,
        groups: [],
      });
    });
  });
});
