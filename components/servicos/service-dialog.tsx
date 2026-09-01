'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus } from 'lucide-react';

import { createServiceAction, updateServiceAction } from '@/app/actions/servicos';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField, Input } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { formatAmount } from '@/lib/utils';

export function ServiceDialog({
  service,
  trigger,
}: {
  service?: {
    id: string;
    name: string;
    priceCents: number;
    durationMin: number;
    bookable: boolean;
  };
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(service);
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    isEdit ? updateServiceAction : createServiceAction,
    idleState,
  );
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Pronto!' });
    setOpen(false);
    router.refresh();
  }, [state, toast, router]);

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
          Novo serviço
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? 'Editar serviço' : 'Novo serviço'}
        description="O preço vem preenchido automaticamente ao registrar um corte."
      >
        <form action={formAction} className="flex flex-col gap-4">
          {service ? <input type="hidden" name="id" value={service.id} /> : null}

          <FormField label="Nome" htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={service?.name ?? ''}
              placeholder="Ex.: Corte + Barba"
              required
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Preço" htmlFor="price">
              <MoneyInput
                id="price"
                name="price"
                defaultValue={service ? formatAmount(service.priceCents) : ''}
                required
              />
            </FormField>

            <FormField
              label="Duração"
              htmlFor="durationMin"
              hint="Minutos que ocupa na agenda"
            >
              <Input
                id="durationMin"
                name="durationMin"
                type="number"
                min={5}
                step={5}
                defaultValue={service?.durationMin ?? 30}
                required
              />
            </FormField>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-input bg-card px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              name="bookable"
              defaultChecked={service?.bookable ?? true}
              className="h-5 w-5 accent-[hsl(var(--primary))]"
            />
            Mostrar na página pública de agendamento
          </label>

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
            <SubmitButton>{isEdit ? 'Salvar' : 'Criar serviço'}</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
