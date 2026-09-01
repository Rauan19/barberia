import { BarChart3 } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import {
  cutStats,
  financeSummary,
  revenueByPaymentMethod,
  topClients,
  topServices,
} from '@/lib/analytics';
import { endOfMonthBR, startOfMonthBR, zonedParts, MONTH_NAMES } from '@/lib/date';
import { PAYMENT_LABEL } from '@/lib/labels';
import { formatBRL, percentChange } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { Breakdown } from '@/components/financeiro/breakdown';
import { RankingList } from '@/components/relatorios/ranking-list';

export const dynamic = 'force-dynamic';

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const now = zonedParts(new Date());

  const year = Number(params.ano) || now.year;
  const month = Number(params.mes) || now.month;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const start = startOfMonthBR(year, month);
  const end = endOfMonthBR(year, month);

  const [stats, previous, finance, clients, services, byPayment] = await Promise.all([
    cutStats(userId, start, end),
    cutStats(userId, startOfMonthBR(prevYear, prevMonth), endOfMonthBR(prevYear, prevMonth)),
    financeSummary(userId, start, end),
    topClients(userId, start, end, 5),
    topServices(userId, start, end, 6),
    revenueByPaymentMethod(userId, start, end),
  ]);

  const years = Array.from({ length: 5 }, (_, i) => now.year - i);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Relatórios"
        description="Fechamento mês a mês do seu trabalho."
      />

      <FilterForm className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <Select name="mes" defaultValue={String(month)} aria-label="Mês">
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </Select>
        <Select name="ano" defaultValue={String(year)} aria-label="Ano">
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </FilterForm>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {MONTH_NAMES[month - 1]} de {year}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">✂️ Cortes</p>
            <p className="text-2xl font-semibold tabular">{stats.count}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">💰 Faturado</p>
            <p className="text-2xl font-semibold tabular text-success">
              {formatBRL(stats.revenueCents)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">👥 Clientes</p>
            <p className="text-2xl font-semibold tabular">{stats.clients}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">📊 Ticket médio</p>
            <p className="text-2xl font-semibold tabular">{formatBRL(stats.ticketCents)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Entradas"
          value={formatBRL(finance.incomeCents)}
          tone="success"
        />
        <StatCard
          label="Saídas"
          value={formatBRL(finance.expenseCents)}
          tone="danger"
        />
        <StatCard
          label="Saldo"
          value={formatBRL(finance.balanceCents)}
          tone={finance.balanceCents >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          label="Cortes vs mês anterior"
          value={String(stats.count)}
          change={percentChange(stats.count, previous.count)}
          hint={`${previous.count} em ${MONTH_NAMES[prevMonth - 1].toLowerCase()}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankingList
          title="Clientes que mais frequentam"
          emptyLabel="Nenhum cliente atendido neste mês."
          rows={clients.map((client) => ({
            id: client.id,
            href: `/dashboard/clientes/${client.id}`,
            label: client.name,
            value: `${client.cuts} corte(s)`,
            hint: formatBRL(client.totalCents),
          }))}
        />
        <RankingList
          title="Serviços mais vendidos"
          emptyLabel="Nenhum serviço registrado neste mês."
          rows={services.map((service) => ({
            id: service.name,
            label: service.name,
            value: `${service.cuts}x`,
            hint: formatBRL(service.totalCents),
          }))}
        />
      </div>

      <Breakdown
        title="Entradas por forma de pagamento"
        emptyLabel="Nenhuma entrada neste mês."
        rows={byPayment.map((row) => ({
          label: PAYMENT_LABEL[row.method],
          totalCents: row.totalCents,
        }))}
      />

      {stats.count === 0 && finance.incomeCents === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <BarChart3 className="mx-auto mb-2 h-6 w-6" />
          Nenhum dado registrado em {MONTH_NAMES[month - 1].toLowerCase()} de {year}.
        </Card>
      ) : null}
    </div>
  );
}
