'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Plus } from 'lucide-react';

import {
  createTransactionAction,
  updateTransactionAction,
} from '@/app/actions/financeiro';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import {
  TransactionFields,
  type TransactionDefaults,
} from '@/components/financeiro/transaction-fields';

export function TransactionDialog({
  transaction,
  defaults,
  label,
  trigger,
}: {
  transaction?: { id: string };
  defaults?: TransactionDefaults;
  label?: string;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(transaction);
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    isEdit ? updateTransactionAction : createTransactionAction,
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
          {label ?? 'Adicionar movimentação'}
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? 'Editar movimentação' : 'Nova movimentação'}
        description={
          isEdit
            ? undefined
            : 'Registre entradas extras e todas as despesas da barbearia.'
        }
      >
        <form action={formAction} className="flex flex-col gap-4">
          {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}

          <TransactionFields key={open ? 'open' : 'closed'} defaults={defaults} />

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
            <SubmitButton>{isEdit ? 'Salvar' : 'Salvar movimentação'}</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
