import Link from 'next/link';
import { Scissors, Wallet, Users, TrendingUp, ArrowRight } from 'lucide-react';

import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cutStats, dailySeries, financeSummary, monthGoalProgress } from '@/lib/analytics';
import { buildInsights } from '@/lib/insights';
import {
  addDaysBR,
  endOfDayBR,
  endOfMonthBR,
  startOfDayBR,
  startOfMonthBR,
  zonedParts,
  MONTH_NAMES,
} from '@/lib/date';
import { formatBRL, percentChange } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { MonthSummary } from '@/components/dashboard/month-summary';
import { GoalCard } from '@/components/dashboard/goal-card';
import { Insights } from '@/components/dashboard/insights';
import { AgendaToday } from '@/components/dashboard/agenda-today';
import { SetupBanner } from '@/components/agenda/setup-banner';
import { CutDialog } from '@/components/cortes/cut-dialog';
import { CutList } from '@/components/cortes/cut-list';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.userId;
  const now = new Date();
  const { year, month } = zonedParts(now);

  const monthStart = startOfMonthBR(year, month);
  const monthEnd = endOfMonthBR(year, month);
  const todayStart = startOfDayBR(now);

  const [
    today,
    yesterday,
    monthStats,
    finance,
    series,
    goal,
    insights,
    recentCuts,
    todayAppointments,
    pendingCount,
    account,
    clients,
    services,
  ] = await Promise.all([
    cutStats(userId, todayStart, endOfDayBR(now)),
    cutStats(userId, addDaysBR(now, -1), new Date(todayStart.getTime() - 1)),
    cutStats(userId, monthStart, monthEnd),
    financeSummary(userId, monthStart, monthEnd),
    dailySeries(userId, addDaysBR(now, -6), endOfDayBR(now)),
    monthGoalProgress(userId, now),
    buildInsights(userId, now),
    prisma.cut.findMany({
      where: { userId },
      orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        id: true,
        serviceName: true,
        priceCents: true,
        paymentMethod: true,
        performedAt: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        userId,
        startAt: { gte: todayStart, lte: endOfDayBR(now) },
        status: { notIn: ['CANCELED'] },
      },
      orderBy: { startAt: 'asc' },
      take: 8,
      select: {
        id: true,
        customerName: true,
        serviceName: true,
        priceCents: true,
        startAt: true,
        status: true,
        paymentMethod: true,
      },
    }),
    prisma.appointment.count({
      where: { userId, status: 'PENDING', endAt: { gte: now } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { scheduleConfigured: true },
    }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.service.findMany({
      where: { userId, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, priceCents: true },
    }),
  ]);

  const chartData = series.map((point) => ({
    label: point.label,
    weekday: point.weekday,
    revenue: point.revenueCents / 100,
    cuts: point.cuts,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {session.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo de hoje e do mês de {MONTH_NAMES[month - 1].toLowerCase()}.
          </p>
        </div>
        <CutDialog clients={clients} services={services} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Hoje</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Cortes"
            value={String(today.count)}
            icon={<Scissors className="h-4 w-4" />}
            change={percentChange(today.count, yesterday.count)}
            hint="vs ontem"
          />
          <StatCard
            label="Faturamento"
            value={formatBRL(today.revenueCents)}
            icon={<Wallet className="h-4 w-4" />}
            tone="success"
            change={percentChange(today.revenueCents, yesterday.revenueCents)}
            hint="vs ontem"
          />
          <StatCard
            label="Clientes"
            value={String(today.clients)}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Ticket médio"
            value={formatBRL(today.ticketCents)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>
      </section>

      {account && !account.scheduleConfigured ? <SetupBanner /> : null}

      <AgendaToday appointments={todayAppointments} pendingCount={pendingCount} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <MonthSummary
            title={`${MONTH_NAMES[month - 1]} de ${year}`}
            finance={finance}
            cuts={monthStats.count}
            ticketCents={monthStats.ticketCents}
          />
          <GoalCard goal={goal} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Últimos cortes</CardTitle>
            <Link
              href="/dashboard/cortes"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentCuts.length > 0 ? (
              <CutList cuts={recentCuts} relative />
            ) : (
              <EmptyState
                icon={<Scissors className="h-6 w-6" />}
                title="Nenhum corte registrado ainda"
                description="Registre o primeiro corte para começar a acompanhar seus números."
                action={<CutDialog clients={clients} services={services} />}
              />
            )}
          </CardContent>
        </Card>

        <Insights items={insights} />
      </div>
    </div>
  );
}
