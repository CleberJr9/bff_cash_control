import {
  MONTH_NAMES_PT_BR,
  startOfWeek,
  toDateKey,
  toUtcMidnight,
} from './home-aggregation';

// Valores iguais aos do enum FilterPeriod do app Flutter
export enum ExpensePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export function periodRange(
  today: Date,
  period: ExpensePeriod,
): { start: Date; end: Date } {
  const end = toUtcMidnight(today);
  switch (period) {
    case ExpensePeriod.DAY:
      return { start: end, end };
    case ExpensePeriod.WEEK:
      return { start: startOfWeek(end), end };
    case ExpensePeriod.MONTH:
      return {
        start: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1)),
        end,
      };
  }
}

// Agrupa por dia (dia/semana) ou por mês (mês), mais recente primeiro,
// mantendo a ordem original dentro de cada grupo.
export function groupByPeriod<T extends { amount: number; date: Date }>(
  items: T[],
  period: ExpensePeriod,
): { key: string; sumAmount: number; items: T[] }[] {
  const groups = new Map<string, { sumAmount: number; items: T[] }>();
  for (const item of items) {
    const dateKey = toDateKey(item.date);
    const key = period === ExpensePeriod.MONTH ? dateKey.slice(0, 7) : dateKey;
    const group = groups.get(key) ?? { sumAmount: 0, items: [] };
    group.sumAmount += item.amount;
    group.items.push(item);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => ({ key, ...group }));
}

// "2026-10-18" -> "18 Out" (dia/semana); "2026-10" -> "Out 2026" (mês)
export function formatGroupDate(key: string, period: ExpensePeriod): string {
  const [year, month, day] = key.split('-');
  const monthName = MONTH_NAMES_PT_BR[Number(month) - 1].slice(0, 3);
  return period === ExpensePeriod.MONTH
    ? `${monthName} ${year}`
    : `${day} ${monthName}`;
}
