'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCheck } from 'lucide-react';

import { completeAppointmentAction } from '@/app/actions/agenda';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { PaymentChoice } from '@/components/publico/payment-choice';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { formatAmount, formatBRL, parseMoneyToCents } from '@/lib/utils';

/** Fecha a conta do atendimento: gera o corte e a entrada no financeiro. */
export function CompleteDialog({
  appointmentId,
  customerName,
  serviceName,
  priceCents,
  paymentMethod,
}: {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  priceCents: number;
  paymentMethod: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [payment, setPayment] = React.useState(paymentMethod);
  const [price, setPrice] = React.useState(formatAmount(priceCents));
  const [state, formAction] = useActionState(completeAppointmentAction, idleState);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({
      title: state.message ?? 'Atendimento concluído!',
      description: 'Entrou no financeiro como entrada.',
    });
    setOpen(false);
    router.refresh();
  }, [state, toast, router]);

  const chargedCents = parseMoneyToCents(price);
  const difference = chargedCents - priceCents;

  return (
    <>
      <Button
        size="sm"
        variant="success"
        onClick={() => {
          handled.current = false;
          setPayment(paymentMethod);
          setPrice(formatAmount(priceCents));
          setOpen(true);
        }}
      >
        <CheckCheck className="h-4 w-4" />
        Concluir
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Concluir atendimento"
        description={`${serviceName} de ${customerName}`}
      >
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={appointmentId} />

          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor combinado</span>
              <span className="font-medium tabular">{formatBRL(priceCents)}</span>
            </div>
          </div>

          <FormField
            label="Quanto o cliente pagou"
            htmlFor="price"
            hint="Cobrou menos ou mais? Troque aqui. É esse valor que entra no financeiro."
          >
            <MoneyInput id="price" name="price" value={price} onValueChange={setPrice} />
          </FormField>

          {difference !== 0 ? (
            <p
              className={`-mt-2 text-sm font-medium ${
                difference < 0 ? 'text-destructive' : 'text-success'
              }`}
            >
              {difference < 0
                ? `${formatBRL(Math.abs(difference))} a menos que o combinado`
                : `${formatBRL(difference)} a mais que o combinado`}
            </p>
          ) : null}

          <FormField label="Forma de pagamento">
            <PaymentChoice value={payment} onChange={setPayment} />
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
            <SubmitButton variant="success">Concluir e lançar</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
