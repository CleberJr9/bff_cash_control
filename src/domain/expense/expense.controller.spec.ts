import { HttpStatus } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { CurrentUserDto } from '../auth/jwt/user/current-user.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensePeriod } from './expense-period';

describe('ExpenseController', () => {
  let service: jest.Mocked<ExpenseService>;
  let controller: ExpenseController;
  const user: CurrentUserDto = { userId: 'user-1', userName: 'Ana' };

  beforeEach(() => {
    service = {
      createExpense: jest.fn(),
      getHome: jest.fn(),
      listByPeriod: jest.fn(),
    } as unknown as jest.Mocked<ExpenseService>;

    controller = new ExpenseController(service);
  });

  describe('create', () => {
    it('delegates to the service using the current user id and wraps the result', async () => {
      const dto: CreateExpenseDto = {
        amount: 500,
        category: 'TRANSPORT',
        title: 'Uber',
        date: '2026-08-20',
      };
      const created = {
        id: 'e1',
        category: 'TRANSPORT',
        title: 'Uber',
        description: null,
        amount: 500,
        date: '2026-08-20',
      };
      service.createExpense.mockResolvedValue(created as never);

      const result = await controller.create(user, dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createExpense).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual({
        status: HttpStatus.CREATED,
        message: 'Expense created successfully',
        data: created,
      });
    });
  });

  describe('home', () => {
    it('delegates to the service using the current user id and wraps the result', async () => {
      const home = {
        user: { name: 'Ana' },
        budget: {
          monthlyBudget: 50000,
          spentThisMonth: 1000,
          currentMonth: 'Agosto',
        },
        chart: { daily: [], weekly: [], monthly: [] },
        byCategory: [],
        transactions: [],
      };
      service.getHome.mockResolvedValue(home);

      const result = await controller.home(user);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.getHome).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        status: HttpStatus.OK,
        message: 'Home data retrieved successfully',
        data: home,
      });
    });
  });

  describe('list', () => {
    it('delegates the period to the service and wraps the result', async () => {
      const list = {
        period: 'week',
        startDate: '2026-08-17',
        endDate: '2026-08-23',
        count: 0,
        totalAmount: 0,
        groups: [],
      };
      service.listByPeriod.mockResolvedValue(list as never);

      const result = await controller.list(user, {
        period: ExpensePeriod.WEEK,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.listByPeriod).toHaveBeenCalledWith(
        'user-1',
        ExpensePeriod.WEEK,
      );
      expect(result).toEqual({
        status: HttpStatus.OK,
        message: 'Expenses retrieved successfully',
        data: list,
      });
    });
  });
});
