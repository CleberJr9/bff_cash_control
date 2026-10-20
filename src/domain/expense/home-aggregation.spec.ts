import {
  buildCategoryTotals,
  buildDailyBuckets,
  buildMonthlyBuckets,
  buildWeeklyBuckets,
  startOfAggregationWindow,
  ExpensePoint,
} from './home-aggregation';
import { Category } from 'src/generated/prisma/enums';

const today = new Date(Date.UTC(2026, 7, 23)); // 2026-08-23 (Sunday)

const point = (
  dateStr: string,
  amount: number,
  category: Category = Category.FOOD,
): ExpensePoint => ({
  date: new Date(`${dateStr}T00:00:00.000Z`),
  amount,
  category,
});

describe('buildDailyBuckets', () => {
  it('returns the last 6 days (inclusive of today) with per-day totals', () => {
    const expenses = [
      point('2026-08-18', 500, Category.TRANSPORT),
      point('2026-08-23', 1000, Category.FOOD),
      point('2026-08-10', 300, Category.HOUSING), // outside the 6-day window
    ];

    const result = buildDailyBuckets(today, expenses);

    expect(result).toEqual([
      { date: '2026-08-18', amount: 500 },
      { date: '2026-08-19', amount: 0 },
      { date: '2026-08-20', amount: 0 },
      { date: '2026-08-21', amount: 0 },
      { date: '2026-08-22', amount: 0 },
      { date: '2026-08-23', amount: 1000 },
    ]);
  });
});

describe('buildWeeklyBuckets', () => {
  it('returns the current Mon-Sun week plus the 3 previous weeks, oldest first', () => {
    const expenses = [
      point('2026-07-27', 200), // 3 weeks ago
      point('2026-08-10', 300), // 1 week ago
      point('2026-08-18', 500), // current week
      point('2026-08-23', 1000), // current week
    ];

    const result = buildWeeklyBuckets(today, expenses);

    expect(result).toEqual([
      { date: '2026-07-27', amount: 200 },
      { date: '2026-08-03', amount: 0 },
      { date: '2026-08-10', amount: 300 },
      { date: '2026-08-17', amount: 1500 },
    ]);
  });
});

describe('buildMonthlyBuckets', () => {
  it('returns the last 6 months (inclusive of current) with per-month totals', () => {
    const expenses = [
      point('2026-08-23', 1000),
      point('2026-08-18', 500),
      point('2026-08-10', 300),
      point('2026-07-27', 200),
      point('2026-06-15', 150),
      point('2026-02-01', 999), // outside the 6-month window
    ];

    const result = buildMonthlyBuckets(today, expenses);

    expect(result).toEqual([
      { date: '2026-03-01', amount: 0 },
      { date: '2026-04-01', amount: 0 },
      { date: '2026-05-01', amount: 0 },
      { date: '2026-06-01', amount: 150 },
      { date: '2026-07-01', amount: 200 },
      { date: '2026-08-01', amount: 1800 },
    ]);
  });
});

describe('buildCategoryTotals', () => {
  it('returns all categories with totals for the current month, zero-filled', () => {
    const expenses = [
      point('2026-08-23', 1000, Category.FOOD),
      point('2026-08-18', 500, Category.TRANSPORT),
      point('2026-08-10', 300, Category.HOUSING),
      point('2026-07-27', 200, Category.LEISURE), // previous month, excluded
    ];

    const result = buildCategoryTotals(today, expenses);

    expect(result).toEqual([
      { category: 'FOOD', amount: 1000 },
      { category: 'TRANSPORT', amount: 500 },
      { category: 'HOUSING', amount: 300 },
      { category: 'LEISURE', amount: 0 },
      { category: 'SHOPPING', amount: 0 },
      { category: 'HEALTH', amount: 0 },
    ]);
  });
});

describe('startOfAggregationWindow', () => {
  it('returns the first day of the month 5 months before today', () => {
    expect(startOfAggregationWindow(today)).toEqual(
      new Date(Date.UTC(2026, 2, 1)), // 2026-03-01
    );
  });
});
