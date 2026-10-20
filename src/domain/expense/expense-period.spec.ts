import {
  ExpensePeriod,
  formatGroupDate,
  groupByPeriod,
  periodRange,
} from './expense-period';

const today = new Date(Date.UTC(2026, 7, 23, 15, 30)); // 2026-08-23 (Sunday)

describe('periodRange', () => {
  it('returns only today for the day period', () => {
    expect(periodRange(today, ExpensePeriod.DAY)).toEqual({
      start: new Date(Date.UTC(2026, 7, 23)),
      end: new Date(Date.UTC(2026, 7, 23)),
    });
  });

  it('returns Monday through today for the week period', () => {
    expect(periodRange(today, ExpensePeriod.WEEK)).toEqual({
      start: new Date(Date.UTC(2026, 7, 17)),
      end: new Date(Date.UTC(2026, 7, 23)),
    });
  });

  it('returns the first day of the month through today for the month period', () => {
    expect(periodRange(today, ExpensePeriod.MONTH)).toEqual({
      start: new Date(Date.UTC(2026, 7, 1)),
      end: new Date(Date.UTC(2026, 7, 23)),
    });
  });
});

describe('groupByPeriod', () => {
  const items = [
    { id: 'a', amount: 1000, date: new Date('2026-08-20') },
    { id: 'b', amount: 250, date: new Date('2026-08-22') },
    { id: 'c', amount: 500, date: new Date('2026-08-20') },
  ];

  it('groups by day, newest day first, for the day and week periods', () => {
    expect(groupByPeriod(items, ExpensePeriod.WEEK)).toEqual([
      { key: '2026-08-22', sumAmount: 250, items: [items[1]] },
      { key: '2026-08-20', sumAmount: 1500, items: [items[0], items[2]] },
    ]);
  });

  it('groups everything in the same month together for the month period', () => {
    expect(groupByPeriod(items, ExpensePeriod.MONTH)).toEqual([
      { key: '2026-08', sumAmount: 1750, items },
    ]);
  });

  it('returns an empty list when there are no items', () => {
    expect(groupByPeriod([], ExpensePeriod.DAY)).toEqual([]);
  });
});

describe('formatGroupDate', () => {
  it('formats as "day month" for the day and week periods', () => {
    expect(formatGroupDate('2026-10-18', ExpensePeriod.DAY)).toBe('18 Out');
    expect(formatGroupDate('2026-03-05', ExpensePeriod.WEEK)).toBe('05 Mar');
  });

  it('formats as "month year" for the month period', () => {
    expect(formatGroupDate('2026-10', ExpensePeriod.MONTH)).toBe('Out 2026');
  });
});
