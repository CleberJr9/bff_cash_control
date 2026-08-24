import { NotFoundException } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './expense.repository';
import { AppLogger } from 'src/shared/logger/logger.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

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

    it('assembles user, budget, chart, byCategory and transactions from the repository data', async () => {
      const expense = {
        expense_id: 'e1',
        num_amount: 1000,
        enum_category: 'FOOD',
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
      repository.findSince.mockResolvedValue([expense] as never);
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
        monthlyBudget: 50000,
        spentThisMonth: 1000,
      });
      expect(result.chart.monthly[5]).toEqual({
        month: '2026-08',
        amount: 1000,
      });
      expect(result.byCategory).toContainEqual({
        category: 'FOOD',
        amount: 1000,
      });
      expect(result.transactions).toEqual([
        {
          id: 'e1',
          category: 'FOOD',
          description: 'Almoço',
          amount: 1000,
          date: '2026-08-23',
        },
      ]);
    });
  });

  describe('createExpense', () => {
    it('creates the expense through the repository and returns it mapped', async () => {
      repository.create.mockResolvedValue({
        expense_id: 'e2',
        num_amount: 500,
        enum_category: 'TRANSPORT',
        tx_description: null,
        dt_date: new Date('2026-08-20T00:00:00.000Z'),
        userId: 'user-1',
        dt_createdAt: now,
        dt_updatedAt: now,
      } as never);

      const dto: CreateExpenseDto = {
        amount: 500,
        category: 'TRANSPORT',
        date: '2026-08-20',
      };

      const result = await service.createExpense('user-1', dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith('user-1', {
        amount: 500,
        category: 'TRANSPORT',
        description: undefined,
        date: new Date('2026-08-20'),
      });
      expect(result).toEqual({
        id: 'e2',
        category: 'TRANSPORT',
        description: null,
        amount: 500,
        date: '2026-08-20',
      });
    });
  });
});
