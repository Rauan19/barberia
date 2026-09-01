import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Phone, Cake, Pencil, Trash2, Scissors } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteClientAction } from '@/app/actions/clientes';
import { formatBRL, formatPhone, initials } from '@/lib/utils';
import { formatDateBR, toDateInput } from '@/lib/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { ClientDialog } from '@/components/clientes/client-dialog';
import { CutDialog } from '@/components/cortes/cut-dialog';
import { CutList } from '@/components/cortes/cut-list';

export const dynamic = 'force-dynamic';

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      cuts: {
        orderBy: [{ performedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          serviceName: true,
          priceCents: true,
          paymentMethod: true,
          performedAt: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!client) notFound();

  const services = await prisma.service.findMany({
    where: { userId, active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, priceCents: true },
  });

  const totalCents = client.cuts.reduce((sum, cut) => sum + cut.priceCents, 0);
  const lastCut = client.cuts[0];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/dashboard/clientes"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Link>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
              {initials(client.name)}
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{client.name}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {client.phone ? (
                  <a
                    href={`tel:${client.phone.replace(/\D/g, '')}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhone(client.phone)}
                  </a>
                ) : null}
                {client.birthDate ? (
                  <span className="flex items-center gap-1">
                    <Cake className="h-3.5 w-3.5" />
                    {formatDateBR(client.birthDate)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <ClientDialog
              client={{
                id: client.id,
                name: client.name,
                phone: client.phone,
                birthDate: client.birthDate ? toDateInput(client.birthDate) : null,
                notes: client.notes,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              }
            />
            <form action={deleteClientAction}>
              <input type="hidden" name="id" value={client.id} />
              <ConfirmButton
                variant="outline"
                size="sm"
                message={`Excluir ${client.name}? Os cortes continuam no histórico, mas sem cliente vinculado.`}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </ConfirmButton>
            </form>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total de cortes</p>
            <p className="text-lg font-semibold tabular">{client.cuts.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total gasto</p>
            <p className="text-lg font-semibold tabular text-success">
              {formatBRL(totalCents)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Último corte</p>
            <p className="text-lg font-semibold">
              {lastCut ? formatDateBR(lastCut.performedAt) : 'Nunca'}
            </p>
          </div>
        </div>

        {client.notes ? (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            {client.notes}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Histórico</CardTitle>
          <CutDialog
            clients={[{ id: client.id, name: client.name }]}
            services={services}
            defaults={{ clientId: client.id }}
            lockClient
            trigger={
              <Button size="sm">
                <Scissors className="h-3.5 w-3.5" />
                Registrar corte
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {client.cuts.length > 0 ? (
            <CutList cuts={client.cuts} />
          ) : (
            <EmptyState
              title="Nenhum corte registrado"
              description="Os cortes desse cliente aparecem aqui."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
