'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus } from 'lucide-react';

import { createCutAction, updateCutAction } from '@/app/actions/cortes';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { formatBRL } from '@/lib/utils';
import {
  CutFields,
  type ClientOption,
  type CutDefaults,
  type ServiceOption,
} from '@/components/cortes/cut-fields';

export function CutDialog({
  clients,
  services,
  cutId,
  defaults,
  lockClient,
  trigger,
}: {
  clients: ClientOption[];
  services: ServiceOption[];
  cutId?: string;
  defaults?: CutDefaults;
  lockClient?: boolean;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(cutId);
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    isEdit ? updateCutAction : createCutAction,
    idleState,
  );
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({
      title: state.message ?? 'Pronto!',
      description: isEdit ? undefined : 'O financeiro já foi atualizado.',
    });
    setOpen(false);
    router.refresh();
  }, [state, toast, router, isEdit]);

  function openDialog() {
    handled.current = false;
    setOpen(true);
  }

  return (
    <>
      {trigger ? (
        <span onClick={openDialog} className="contents">
          {trigger}
        </span>
      ) : (
        <Button onClick={openDialog}>
          <Plus className="h-4 w-4" />
          Registrar corte
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? 'Editar corte' : 'Registrar corte'}
        description={
          isEdit
            ? 'A entrada no financeiro é atualizada junto.'
            : 'O corte entra automaticamente como entrada no financeiro.'
        }
      >
        <form action={formAction} className="flex flex-col gap-4">
          {cutId ? <input type="hidden" name="id" value={cutId} /> : null}

          <CutFields
            key={open ? 'open' : 'closed'}
            clients={clients}
            services={services}
            defaults={defaults}
            lockClient={lockClient}
          />

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton>{isEdit ? 'Salvar' : 'Registrar corte'}</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function CutSuccessSummary({
  clientName,
  priceCents,
  method,
}: {
  clientName: string;
  priceCents: number;
  method: string;
}) {
  return (
    <div className="text-sm">
      <p className="font-medium">{clientName}</p>
      <p className="text-muted-foreground">
        {formatBRL(priceCents)} · {method}
      </p>
    </div>
  );
}
