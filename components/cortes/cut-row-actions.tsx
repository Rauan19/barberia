'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { deleteCutAction } from '@/app/actions/cortes';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { CutDialog } from '@/components/cortes/cut-dialog';
import type { ClientOption, ServiceOption } from '@/components/cortes/cut-fields';
import { formatAmount } from '@/lib/utils';
import { toDateInput } from '@/lib/date';

export type EditableCut = {
  id: string;
  clientId: string | null;
  serviceId: string | null;
  serviceName: string;
  priceCents: number;
  paymentMethod: string;
  performedAt: Date;
  notes: string | null;
};

export function CutRowActions({
  cut,
  clients,
  services,
}: {
  cut: EditableCut;
  clients: ClientOption[];
  services: ServiceOption[];
}) {
  return (
    <div className="flex items-center gap-1">
      <CutDialog
        clients={clients}
        services={services}
        cutId={cut.id}
        defaults={{
          clientId: cut.clientId,
          serviceId: cut.serviceId,
          serviceName: cut.serviceName,
          priceCents: cut.priceCents,
          paymentMethod: cut.paymentMethod,
          performedAt: toDateInput(cut.performedAt),
          notes: cut.notes,
        }}
        trigger={
          <Button variant="ghost" size="icon" title="Editar corte">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />

      <form action={deleteCutAction}>
        <input type="hidden" name="id" value={cut.id} />
        <ConfirmButton
          variant="ghost"
          size="icon"
          title="Excluir corte"
          className="text-destructive hover:bg-destructive/10"
          message={`Excluir o corte de R$ ${formatAmount(cut.priceCents)}? A entrada no financeiro também será removida.`}
        >
          <Trash2 className="h-4 w-4" />
        </ConfirmButton>
      </form>
    </div>
  );
}
