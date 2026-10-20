import { Category } from 'src/generated/prisma/enums';

export type ExpensePoint = {
  amount: number;
  category: Category;
  date: Date;
};

export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

export function startOfWeek(date: Date): Date {
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDays(date, -diffToMonday);
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

const WEEKDAY_NAMES_PT_BR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function shortMonthName(date: Date): string {
  return MONTH_NAMES_PT_BR[date.getUTCMonth()].slice(0, 3);
}

// Rótulos do eixo do gráfico: "Seg" (dia), "17 Ago" (semana), "Ago" (mês)
function dayLabel(date: Date): string {
  return WEEKDAY_NAMES_PT_BR[date.getUTCDay()];
}

function weekLabel(weekStart: Date): string {
  const day = String(weekStart.getUTCDate()).padStart(2, '0');
  return `${day} ${shortMonthName(weekStart)}`;
}

export function startOfAggregationWindow(today: Date): Date {
  return addMonths(toUtcMidnight(today), -5);
}

export function buildDailyBuckets(today: Date, expenses: ExpensePoint[]) {
  const base = toUtcMidnight(today);
  const totalsByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = toDateKey(expense.date);
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + expense.amount);
  }

  const buckets: { date: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const day = addDays(base, -i);
    const key = toDateKey(day);
    buckets.push({
      date: key,
      label: dayLabel(day),
      amount: totalsByDay.get(key) ?? 0,
    });
  }
  return buckets;
}

export function buildWeeklyBuckets(today: Date, expenses: ExpensePoint[]) {
  const currentWeekStart = startOfWeek(toUtcMidnight(today));

  const buckets: { date: string; label: string; amount: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const weekEnd = addDays(weekStart, 6);
    const amount = expenses
      .filter((expense) => expense.date >= weekStart && expense.date <= weekEnd)
      .reduce((sum, expense) => sum + expense.amount, 0);
    buckets.push({
      date: toDateKey(weekStart),
      label: weekLabel(weekStart),
      amount,
    });
  }
  return buckets;
}

export function buildMonthlyBuckets(today: Date, expenses: ExpensePoint[]) {
  const base = toUtcMidnight(today);
  const totalsByMonth = new Map<string, number>();
  for (const expense of expenses) {
    const key = toMonthKey(expense.date);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + expense.amount);
  }

  const buckets: { date: string; label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = addMonths(base, -i);
    const key = toMonthKey(monthStart);
    buckets.push({
      date: toDateKey(monthStart),
      label: shortMonthName(monthStart),
      amount: totalsByMonth.get(key) ?? 0,
    });
  }
  return buckets;
}

export function buildCategoryTotals(today: Date, expenses: ExpensePoint[]) {
  const currentMonthKey = toMonthKey(toUtcMidnight(today));
  const totals = new Map<Category, number>(
    Object.values(Category).map((category) => [category, 0]),
  );

  for (const expense of expenses) {
    if (toMonthKey(expense.date) === currentMonthKey) {
      totals.set(
        expense.category,
        (totals.get(expense.category) ?? 0) + expense.amount,
      );
    }
  }

  return Object.values(Category).map((category) => ({
    category,
    amount: totals.get(category) ?? 0,
  }));
}

export const MONTH_NAMES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function monthNamePtBr(date: Date): string {
  return MONTH_NAMES_PT_BR[date.getUTCMonth()];
}
