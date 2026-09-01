import 'server-only';

import type { PaymentMethod, TransactionCategory } from '@prisma/client';

import { prisma } from '@/lib/db';
import {
  addDaysBR,
  endOfDayBR,
  endOfMonthBR,
  formatShortDateBR,
  startOfDayBR,
  startOfMonthBR,
  zonedParts,
  WEEKDAY_SHORT,
} from '@/lib/date';

export type CutStats = {
  count: number;
  revenueCents: number;
  clients: number;
  ticketCents: number;
};

/** Numeros de cortes em um intervalo. */
export async function cutStats(
  userId: string,
  start: Date,
  end: Date,
): Promise<CutStats> {
  const where = { userId, performedAt: { gte: start, lte: end } };

  const [aggregate, distinctClients] = await Promise.all([
    prisma.cut.aggregate({ where, _count: true, _sum: { priceCents: true } }),
    prisma.cut.findMany({
      where: { ...where, clientId: { not: null } },
      select: { clientId: true },
      distinct: ['clientId'],
    }),
  ]);

  const count = aggregate._count;
  const revenueCents = aggregate._sum.priceCents ?? 0;

  return {
    count,
    revenueCents,
    clients: distinctClients.length,
    ticketCents: count > 0 ? Math.round(revenueCents / count) : 0,
  };
}

export type FinanceSummary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  cutIncomeCents: number;
  otherIncomeCents: number;
};

/** Entradas, saidas e saldo de um intervalo. */
export async function financeSummary(
  userId: string,
  start: Date,
  end: Date,
): Promise<FinanceSummary> {
  const rows = await prisma.financialTransaction.groupBy({
    by: ['type', 'category'],
    where: { userId, date: { gte: start, lte: end } },
    _sum: { amountCents: true },
  });

  let incomeCents = 0;
  let expenseCents = 0;
  let cutIncomeCents = 0;

  for (const row of rows) {
    const sum = row._sum.amountCents ?? 0;
    if (row.type === 'INCOME') {
      incomeCents += sum;
      if (row.category === 'CORTE') cutIncomeCents += sum;
    } else {
      expenseCents += sum;
    }
  }

  return {
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    cutIncomeCents,
    otherIncomeCents: incomeCents - cutIncomeCents,
  };
}

/** Total por forma de pagamento (somente entradas). */
export async function revenueByPaymentMethod(
  userId: string,
  start: Date,
  end: Date,
): Promise<{ method: PaymentMethod; totalCents: number }[]> {
  const rows = await prisma.financialTransaction.groupBy({
    by: ['paymentMethod'],
    where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
    _sum: { amountCents: true },
  });

  return rows
    .map((row) => ({ method: row.paymentMethod, totalCents: row._sum.amountCents ?? 0 }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** Total de despesas por categoria. */
export async function expensesByCategory(
  userId: string,
  start: Date,
  end: Date,
): Promise<{ category: TransactionCategory; totalCents: number }[]> {
  const rows = await prisma.financialTransaction.groupBy({
    by: ['category'],
    where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
    _sum: { amountCents: true },
  });

  return rows
    .map((row) => ({ category: row.category, totalCents: row._sum.amountCents ?? 0 }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export type DailyPoint = {
  key: string;
  label: string;
  weekday: string;
  revenueCents: number;
  expenseCents: number;
  cuts: number;
};

/** Serie diaria de faturamento/despesa dentro do intervalo. */
export async function dailySeries(
  userId: string,
  start: Date,
  end: Date,
): Promise<DailyPoint[]> {
  const [transactions, cuts] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { type: true, amountCents: true, date: true },
    }),
    prisma.cut.findMany({
      where: { userId, performedAt: { gte: start, lte: end } },
      select: { performedAt: true },
    }),
  ]);

  const buckets = new Map<string, DailyPoint>();

  for (
    let cursor = startOfDayBR(start);
    cursor.getTime() <= end.getTime();
    cursor = addDaysBR(cursor, 1)
  ) {
    const parts = zonedParts(cursor);
    const key = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    buckets.set(key, {
      key,
      label: formatShortDateBR(cursor),
      weekday: WEEKDAY_SHORT[parts.weekday],
      revenueCents: 0,
      expenseCents: 0,
      cuts: 0,
    });
  }

  const keyOf = (date: Date) => {
    const p = zonedParts(date);
    return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  };

  for (const tx of transactions) {
    const bucket = buckets.get(keyOf(tx.date));
    if (!bucket) continue;
    if (tx.type === 'INCOME') bucket.revenueCents += tx.amountCents;
    else bucket.expenseCents += tx.amountCents;
  }

  for (const cut of cuts) {
    const bucket = buckets.get(keyOf(cut.performedAt));
    if (bucket) bucket.cuts += 1;
  }

  return [...buckets.values()];
}

/** Ranking de clientes por numero de cortes. */
export async function topClients(userId: string, start: Date, end: Date, take = 5) {
  const rows = await prisma.cut.groupBy({
    by: ['clientId'],
    where: { userId, performedAt: { gte: start, lte: end }, clientId: { not: null } },
    _count: { _all: true },
    _sum: { priceCents: true },
    orderBy: { _count: { clientId: 'desc' } },
    take,
  });

  if (rows.length === 0) return [];

  const clients = await prisma.client.findMany({
    where: { userId, id: { in: rows.map((r) => r.clientId!) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(clients.map((c) => [c.id, c.name]));

  return rows.map((row) => ({
    id: row.clientId!,
    name: nameById.get(row.clientId!) ?? 'Cliente removido',
    cuts: row._count._all,
    totalCents: row._sum.priceCents ?? 0,
  }));
}

/** Ranking de servicos mais vendidos (pelo nome gravado no corte). */
export async function topServices(userId: string, start: Date, end: Date, take = 6) {
  const rows = await prisma.cut.groupBy({
    by: ['serviceName'],
    where: { userId, performedAt: { gte: start, lte: end } },
    _count: { _all: true },
    _sum: { priceCents: true },
    orderBy: { _count: { serviceName: 'desc' } },
    take,
  });

  return rows.map((row) => ({
    name: row.serviceName,
    cuts: row._count._all,
    totalCents: row._sum.priceCents ?? 0,
  }));
}

/** Meta do mes corrente com o progresso ja calculado. */
export async function monthGoalProgress(userId: string, now = new Date()) {
  const { year, month } = zonedParts(now);
  const start = startOfMonthBR(year, month);
  const end = endOfMonthBR(year, month);

  const [goal, stats] = await Promise.all([
    prisma.goal.findUnique({ where: { userId_year_month: { userId, year, month } } }),
    cutStats(userId, start, end),
  ]);

  if (!goal) return null;

  return {
    year,
    month,
    revenueTarget: goal.revenueTarget,
    cutsTarget: goal.cutsTarget,
    revenueCents: stats.revenueCents,
    cuts: stats.count,
    revenuePercent:
      goal.revenueTarget > 0
        ? Math.min(999, (stats.revenueCents / goal.revenueTarget) * 100)
        : 0,
    cutsPercent:
      goal.cutsTarget > 0 ? Math.min(999, (stats.count / goal.cutsTarget) * 100) : 0,
  };
}

export { startOfDayBR, endOfDayBR, startOfMonthBR, endOfMonthBR };
