import { Wallet } from 'lucide-react';
import type {
  PaymentMethod,
  Prisma,
  TransactionCategory,
  TransactionType,
} from '@prisma/client';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  dailySeries,
  expensesByCategory,
  financeSummary,
  revenueByPaymentMethod,
} from '@/lib/analytics';
import { resolvePeriod } from '@/lib/period';
import { CATEGORY_EMOJI, CATEGORY_LABEL, PAYMENT_LABEL } from '@/lib/labels';
import { formatBRL, percentChange } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { FinanceChart } from '@/components/financeiro/finance-chart';
import { FinanceFilters } from '@/components/financeiro/finance-filters';
import { TransactionDialog } from '@/components/financeiro/transaction-dialog';
import { TransactionList } from '@/components/financeiro/transaction-list';
import { Breakdown } from '@/components/financeiro/breakdown';

export const dynamic = 'force-dynamic';

type SearchParams = {
  periodo?: string;
  de?: string;
  ate?: string;
  tipo?: string;
  categoria?: string;
  pagamento?: string;
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const period = resolvePeriod(params.periodo, params.de, params.ate);

  const listWhere: Prisma.FinancialTransactionWhereInput = {
    userId,
    date: { gte: period.start, lte: period.end },
    ...(params.tipo ? { type: params.tipo as TransactionType } : {}),
    ...(params.categoria ? { category: params.categoria as TransactionCategory } : {}),
    ...(params.pagamento ? { paymentMethod: params.pagamento as PaymentMethod } : {}),
  };

  const [summary, previousSummary, series, transactions, byPayment, byCategory] =
    await Promise.all([
      financeSummary(userId, period.start, period.end),
      financeSummary(userId, period.previousStart, period.previousEnd),
      dailySeries(userId, period.start, period.end),
      prisma.financialTransaction.findMany({
        where: listWhere,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 300,
        select: {
          id: true,
          type: true,
          description: true,
          category: true,
          amountCents: true,
          paymentMethod: true,
          date: true,
          notes: true,
          cutId: true,
        },
      }),
      revenueByPaymentMethod(userId, period.start, period.end),
      expensesByCategory(userId, period.start, period.end),
    ]);

  const chartData = series.map((point) => ({
    label: point.label,
    weekday: point.weekday,
    entradas: point.revenueCents / 100,
    saidas: point.expenseCents / 100,
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Financeiro"
        description={`Entradas e saídas · ${period.label}`}
        action={<TransactionDialog />}
      />

      <FinanceFilters
        period={period}
        selected={{
          tipo: params.tipo,
          categoria: params.categoria,
          pagamento: params.pagamento,
        }}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          compact
          label="Entradas"
          value={formatBRL(summary.incomeCents)}
          tone="success"
          change={percentChange(summary.incomeCents, previousSummary.incomeCents)}
        />
        <StatCard
          compact
          label="Saídas"
          value={formatBRL(summary.expenseCents)}
          tone="danger"
          change={percentChange(summary.expenseCents, previousSummary.expenseCents)}
        />
        <StatCard
          compact
          label="Saldo"
          value={formatBRL(summary.balanceCents)}
          tone={summary.balanceCents >= 0 ? 'success' : 'danger'}
        />
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        {formatBRL(summary.cutIncomeCents)} vieram de cortes ·{' '}
        {formatBRL(summary.otherIncomeCents)} de outras entradas.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Movimentação do período</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Entradas por forma de pagamento"
          emptyLabel="Nenhuma entrada no período."
          rows={byPayment.map((row) => ({
            label: PAYMENT_LABEL[row.method],
            totalCents: row.totalCents,
          }))}
        />
        <Breakdown
          title="Saídas por categoria"
          tone="danger"
          emptyLabel="Nenhuma despesa no período."
          rows={byCategory.map((row) => ({
            label: CATEGORY_LABEL[row.category],
            emoji: CATEGORY_EMOJI[row.category],
            totalCents: row.totalCents,
          }))}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Histórico de movimentações</CardTitle>
          <span className="text-sm text-muted-foreground">
            {transactions.length} registro(s)
          </span>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <TransactionList transactions={transactions} />
          ) : (
            <EmptyState
              icon={<Wallet className="h-6 w-6" />}
              title="Nenhuma movimentação no período"
              description="Os cortes entram aqui automaticamente. Registre também outras entradas e despesas."
              action={<TransactionDialog />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
