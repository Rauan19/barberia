import { Scissors } from 'lucide-react';
import type { PaymentMethod, Prisma } from '@prisma/client';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cutStats } from '@/lib/analytics';
import { resolvePeriod } from '@/lib/period';
import { formatBRL } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { CutDialog } from '@/components/cortes/cut-dialog';
import { CutList } from '@/components/cortes/cut-list';
import { CutFilters } from '@/components/cortes/cut-filters';
import { CutRowActions } from '@/components/cortes/cut-row-actions';

export const dynamic = 'force-dynamic';

type SearchParams = {
  periodo?: string;
  de?: string;
  ate?: string;
  cliente?: string;
  servico?: string;
  pagamento?: string;
};

export default async function CortesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const period = resolvePeriod(params.periodo ?? '30dias', params.de, params.ate);

  const where: Prisma.CutWhereInput = {
    userId,
    performedAt: { gte: period.start, lte: period.end },
    ...(params.cliente ? { clientId: params.cliente } : {}),
    ...(params.servico ? { serviceName: params.servico } : {}),
    ...(params.pagamento
      ? { paymentMethod: params.pagamento as PaymentMethod }
      : {}),
  };

  const [cuts, clients, services, serviceNames, stats] = await Promise.all([
    prisma.cut.findMany({
      where,
      orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
      take: 300,
      select: {
        id: true,
        clientId: true,
        serviceId: true,
        serviceName: true,
        priceCents: true,
        paymentMethod: true,
        performedAt: true,
        notes: true,
        client: { select: { id: true, name: true } },
      },
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
    prisma.cut.findMany({
      where: { userId },
      distinct: ['serviceName'],
      orderBy: { serviceName: 'asc' },
      select: { serviceName: true },
    }),
    cutStats(userId, period.start, period.end),
  ]);

  const filteredTotal = cuts.reduce((sum, cut) => sum + cut.priceCents, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cortes"
        description="Histórico completo dos atendimentos."
        action={<CutDialog clients={clients} services={services} />}
      />

      <CutFilters
        period={period}
        clients={clients}
        serviceNames={serviceNames.map((s) => s.serviceName)}
        selected={{
          cliente: params.cliente,
          servico: params.servico,
          pagamento: params.pagamento,
        }}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cortes no período" value={String(stats.count)} />
        <StatCard
          label="Faturamento"
          value={formatBRL(stats.revenueCents)}
          tone="success"
        />
        <StatCard label="Ticket médio" value={formatBRL(stats.ticketCents)} />
        <StatCard label="Clientes atendidos" value={String(stats.clients)} />
      </div>

      <Card>
        <CardContent className="pt-5">
          {cuts.length > 0 ? (
            <>
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {cuts.length} corte(s) · {period.label}
                </span>
                <span className="font-medium text-foreground tabular">
                  {formatBRL(filteredTotal)}
                </span>
              </div>
              <CutList
                cuts={cuts}
                action={(cut) => {
                  const full = cuts.find((c) => c.id === cut.id)!;
                  return (
                    <CutRowActions
                      cut={{
                        id: full.id,
                        clientId: full.clientId,
                        serviceId: full.serviceId,
                        serviceName: full.serviceName,
                        priceCents: full.priceCents,
                        paymentMethod: full.paymentMethod,
                        performedAt: full.performedAt,
                        notes: full.notes,
                      }}
                      clients={clients}
                      services={services}
                    />
                  );
                }}
              />
            </>
          ) : (
            <EmptyState
              icon={<Scissors className="h-6 w-6" />}
              title="Nenhum corte no período"
              description="Ajuste os filtros ou registre um novo corte."
              action={<CutDialog clients={clients} services={services} />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
