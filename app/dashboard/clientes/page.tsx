import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatBRL, formatPhone, initials } from '@/lib/utils';
import { relativeDayLabel } from '@/lib/date';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { ClientDialog } from '@/components/clientes/client-dialog';

export const dynamic = 'force-dynamic';

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await requireUserId();
  const { q } = await searchParams;

  const clients = await prisma.client.findMany({
    where: {
      userId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      phone: true,
      cuts: {
        orderBy: { performedAt: 'desc' },
        take: 1,
        select: { performedAt: true },
      },
      _count: { select: { cuts: true } },
    },
  });

  const totals = await prisma.cut.groupBy({
    by: ['clientId'],
    where: { userId, clientId: { in: clients.map((c) => c.id) } },
    _sum: { priceCents: true },
  });
  const spentByClient = new Map(
    totals.map((row) => [row.clientId, row._sum.priceCents ?? 0]),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Clientes"
        description={`${clients.length} cliente(s)${q ? ' encontrado(s)' : ' cadastrado(s)'}.`}
        action={<ClientDialog />}
      />

      <SearchInput placeholder="Buscar por nome ou telefone..." />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={q ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          description={
            q
              ? 'Tente buscar por outro nome ou telefone.'
              : 'Cadastre seus clientes para acompanhar histórico e frequência.'
          }
          action={q ? undefined : <ClientDialog />}
        />
      ) : (
        <Card className="divide-y divide-border">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/clientes/${client.id}`}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                {initials(client.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{client.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatPhone(client.phone) || 'Sem telefone'}
                </p>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-medium tabular">
                  {formatBRL(spentByClient.get(client.id) ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client._count.cuts} corte(s)
                </p>
              </div>

              <div className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                {client.cuts[0]
                  ? relativeDayLabel(client.cuts[0].performedAt)
                  : 'Sem cortes'}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
