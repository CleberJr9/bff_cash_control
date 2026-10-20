import * as bcrypt from 'bcrypt';
import { Category, PrismaClient } from '../../src/generated/prisma/client';

const USER_EMAIL = 'clebergoesjr@gmail.com';
const DEFAULT_PASSWORD = '12345678'; // usado apenas se o usuário ainda não existir
const MONTHS_BACK = 12;
const MONTHLY_BUDGET = 1500000; // R$ 15.000,00 em centavos

// PRNG determinístico (mulberry32) para o seed gerar sempre os mesmos dados
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(42);
const randInt = (min: number, max: number) =>
  Math.floor(random() * (max - min + 1)) + min;
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

type Template = {
  title: string;
  description?: string;
  min: number; // centavos
  max: number; // centavos
};

// Gastos variáveis, sorteados ao longo do mês
const VARIABLE: Record<
  Category,
  { perMonth: [number, number]; items: Template[] }
> = {
  FOOD: {
    perMonth: [18, 30],
    items: [
      {
        title: 'Supermercado',
        description: 'Compras da semana',
        min: 15000,
        max: 65000,
      },
      { title: 'iFood', min: 3500, max: 12000 },
      { title: 'Padaria', min: 800, max: 4500 },
      { title: 'Almoço no trabalho', min: 2500, max: 6000 },
      {
        title: 'Restaurante',
        description: 'Jantar fora',
        min: 8000,
        max: 28000,
      },
      { title: 'Café', min: 700, max: 2500 },
      { title: 'Feira', min: 4000, max: 12000 },
      { title: 'Açougue', min: 6000, max: 18000 },
    ],
  },
  TRANSPORT: {
    perMonth: [8, 16],
    items: [
      { title: 'Uber', min: 1500, max: 6500 },
      { title: '99', min: 1200, max: 4500 },
      {
        title: 'Combustível',
        description: 'Posto Shell',
        min: 15000,
        max: 32000,
      },
      { title: 'Estacionamento', min: 1000, max: 4000 },
      { title: 'Pedágio', min: 650, max: 2200 },
      { title: 'Metrô', min: 520, max: 1040 },
    ],
  },
  HOUSING: {
    perMonth: [0, 2],
    items: [
      {
        title: 'Manutenção',
        description: 'Reparo hidráulico',
        min: 8000,
        max: 45000,
      },
      { title: 'Material de limpeza', min: 3000, max: 12000 },
      { title: 'Utensílios de casa', min: 2500, max: 15000 },
    ],
  },
  LEISURE: {
    perMonth: [3, 8],
    items: [
      { title: 'Cinema', min: 3000, max: 9000 },
      { title: 'Bar com amigos', min: 6000, max: 22000 },
      { title: 'Show', description: 'Ingresso', min: 12000, max: 45000 },
      { title: 'Viagem de fim de semana', min: 40000, max: 150000 },
      { title: 'Jogo na Steam', min: 2500, max: 25000 },
      { title: 'Passeio no parque', min: 1500, max: 6000 },
    ],
  },
  SHOPPING: {
    perMonth: [2, 6],
    items: [
      { title: 'Roupas', min: 8000, max: 45000 },
      { title: 'Amazon', min: 3000, max: 30000 },
      { title: 'Mercado Livre', min: 2500, max: 25000 },
      { title: 'Tênis', min: 25000, max: 70000 },
      {
        title: 'Eletrônicos',
        description: 'Acessório para o celular',
        min: 5000,
        max: 40000,
      },
      { title: 'Presente', min: 6000, max: 25000 },
    ],
  },
  HEALTH: {
    perMonth: [1, 4],
    items: [
      { title: 'Farmácia', min: 2000, max: 18000 },
      { title: 'Consulta médica', min: 25000, max: 50000 },
      { title: 'Exames', min: 8000, max: 35000 },
      { title: 'Dentista', min: 15000, max: 60000 },
      { title: 'Suplementos', min: 9000, max: 25000 },
    ],
  },
};

// Gastos fixos, todo mês no mesmo dia
const RECURRING: (Template & { category: Category; day: number })[] = [
  {
    category: Category.HOUSING,
    day: 5,
    title: 'Aluguel',
    min: 220000,
    max: 220000,
  },
  {
    category: Category.HOUSING,
    day: 10,
    title: 'Condomínio',
    min: 65000,
    max: 65000,
  },
  {
    category: Category.HOUSING,
    day: 12,
    title: 'Conta de luz',
    min: 14000,
    max: 32000,
  },
  {
    category: Category.HOUSING,
    day: 12,
    title: 'Conta de água',
    min: 6000,
    max: 11000,
  },
  {
    category: Category.HOUSING,
    day: 15,
    title: 'Internet',
    min: 11990,
    max: 11990,
  },
  {
    category: Category.HEALTH,
    day: 8,
    title: 'Plano de saúde',
    min: 48000,
    max: 48000,
  },
  {
    category: Category.HEALTH,
    day: 3,
    title: 'Academia',
    min: 12990,
    max: 12990,
  },
  {
    category: Category.LEISURE,
    day: 18,
    title: 'Netflix',
    min: 5590,
    max: 5590,
  },
  {
    category: Category.LEISURE,
    day: 20,
    title: 'Spotify',
    min: 2190,
    max: 2190,
  },
  {
    category: Category.TRANSPORT,
    day: 25,
    title: 'Seguro do carro',
    min: 21000,
    max: 21000,
  },
];

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function buildExpenses(userId: string) {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const expenses: {
    userId: string;
    num_amount: number;
    enum_category: Category;
    tx_title: string;
    tx_description: string | null;
    dt_date: Date;
  }[] = [];

  for (let offset = MONTHS_BACK - 1; offset >= 0; offset--) {
    const ref = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 1),
    );
    const year = ref.getUTCFullYear();
    const month = ref.getUTCMonth();
    const lastDay = daysInMonth(year, month);

    const push = (category: Category, t: Template, day: number) => {
      const date = new Date(Date.UTC(year, month, Math.min(day, lastDay)));
      if (date.getTime() > todayUtc) return; // nada no futuro
      expenses.push({
        userId,
        num_amount: randInt(t.min, t.max),
        enum_category: category,
        tx_title: t.title,
        tx_description: t.description ?? null,
        dt_date: date,
      });
    };

    for (const r of RECURRING) push(r.category, r, r.day);

    for (const category of Object.values(Category)) {
      const { perMonth, items } = VARIABLE[category];
      const count = randInt(perMonth[0], perMonth[1]);
      for (let i = 0; i < count; i++) {
        push(category, pick(items), randInt(1, lastDay));
      }
    }
  }

  // Garante despesas em todos os dias da semana atual (segunda até hoje),
  // para os filtros "day" e "week" da página de despesas nunca virem vazios.
  const DAILY_CATEGORIES: Category[] = [
    Category.FOOD,
    Category.FOOD,
    Category.TRANSPORT,
    Category.LEISURE,
    Category.SHOPPING,
  ];
  const dayOfWeek = new Date(todayUtc).getUTCDay(); // 0 = domingo
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  for (let back = daysSinceMonday; back >= 0; back--) {
    const date = new Date(todayUtc - back * 24 * 60 * 60 * 1000);
    const count = back === 0 ? randInt(3, 5) : randInt(1, 3);
    for (let i = 0; i < count; i++) {
      const category = pick(DAILY_CATEGORIES);
      const t = pick(VARIABLE[category].items);
      expenses.push({
        userId,
        num_amount: randInt(t.min, t.max),
        enum_category: category,
        tx_title: t.title,
        tx_description: t.description ?? null,
        dt_date: date,
      });
    }
  }

  return expenses;
}

export async function seedExpenses(prisma: PrismaClient) {
  let user = await prisma.user.findUnique({ where: { tx_email: USER_EMAIL } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        tx_name: 'Cleber Goes Jr',
        tx_email: USER_EMAIL,
        tx_passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10),
        num_monthlyBudget: MONTHLY_BUDGET,
      },
    });
    console.log(`Usuário criado: ${USER_EMAIL} (senha: ${DEFAULT_PASSWORD})`);
  } else {
    user = await prisma.user.update({
      where: { user_id: user.user_id },
      data: { num_monthlyBudget: MONTHLY_BUDGET },
    });
  }

  const { count: removed } = await prisma.expense.deleteMany({
    where: { userId: user.user_id },
  });

  const expenses = buildExpenses(user.user_id);
  const { count } = await prisma.expense.createMany({ data: expenses });

  console.log(
    `Despesas de ${USER_EMAIL}: ${removed} removidas, ${count} criadas (últimos ${MONTHS_BACK} meses).`,
  );
}
