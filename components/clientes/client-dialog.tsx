'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus } from 'lucide-react';

import { createClientAction, updateClientAction } from '@/app/actions/clientes';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField, Input, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';

export type ClientDefaults = {
  id: string;
  name: string;
  phone?: string | null;
  birthDate?: string | null;
  notes?: string | null;
};

export function ClientDialog({
  client,
  trigger,
}: {
  client?: ClientDefaults;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(client);
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    isEdit ? updateClientAction : createClientAction,
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
          Novo cliente
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? 'Editar cliente' : 'Novo cliente'}
      >
        <form action={formAction} className="flex flex-col gap-4">
          {client ? <input type="hidden" name="id" value={client.id} /> : null}

          <FormField label="Nome" htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={client?.name ?? ''}
              placeholder="Ex.: João Silva"
              required
              autoFocus
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Telefone" htmlFor="phone" hint="Opcional">
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client?.phone ?? ''}
                placeholder="75 99999-9999"
              />
            </FormField>

            <FormField label="Nascimento" htmlFor="birthDate" hint="Opcional">
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={client?.birthDate ?? ''}
              />
            </FormField>
          </div>

          <FormField label="Observações" htmlFor="notes" hint="Opcional">
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={client?.notes ?? ''}
              placeholder="Ex.: prefere máquina 2, atende aos sábados"
            />
          </FormField>

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
            <SubmitButton>{isEdit ? 'Salvar' : 'Cadastrar'}</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
