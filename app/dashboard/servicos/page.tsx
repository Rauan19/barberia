import { Sparkles, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteServiceAction, toggleServiceAction } from '@/app/actions/servicos';
import { formatBRL } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { ServiceDialog } from '@/components/servicos/service-dialog';

export const dynamic = 'force-dynamic';

export default async function ServicosPage() {
  const userId = await requireUserId();

  const services = await prisma.service.findMany({
    where: { userId },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      priceCents: true,
      durationMin: true,
      bookable: true,
      active: true,
      _count: { select: { cuts: true } },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Serviços"
        description="Defina os preços usados ao registrar um corte."
        action={<ServiceDialog />}
      />

      {services.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Nenhum serviço cadastrado"
          description="Cadastre corte, barba e combos para agilizar o registro."
          action={<ServiceDialog />}
        />
      ) : (
        <Card className="divide-y divide-border">
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{service.name}</p>
                  {!service.active ? <Badge variant="muted">Inativo</Badge> : null}
                  {service.active && !service.bookable ? (
                    <Badge variant="outline">Fora do agendamento</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {service.durationMin} min · {service._count.cuts} corte(s)
                </p>
              </div>

              <p className="shrink-0 text-base font-semibold tabular">
                {formatBRL(service.priceCents)}
              </p>

              <div className="flex shrink-0 items-center gap-1">
                <ServiceDialog
                  service={{
                    id: service.id,
                    name: service.name,
                    priceCents: service.priceCents,
                    durationMin: service.durationMin,
                    bookable: service.bookable,
                  }}
                  trigger={
                    <Button variant="ghost" size="icon" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />

                <form action={toggleServiceAction}>
                  <input type="hidden" name="id" value={service.id} />
                  <input type="hidden" name="active" value={String(!service.active)} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    title={service.active ? 'Desativar' : 'Ativar'}
                  >
                    {service.active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </form>

                <form action={deleteServiceAction}>
                  <input type="hidden" name="id" value={service.id} />
                  <ConfirmButton
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    className="text-destructive hover:bg-destructive/10"
                    message={`Excluir "${service.name}"? Os cortes já registrados continuam no histórico.`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </ConfirmButton>
                </form>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
