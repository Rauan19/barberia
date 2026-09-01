'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarPlus, Pencil } from 'lucide-react';

import {
  createAppointmentAction,
  updateAppointmentAction,
} from '@/app/actions/agenda';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { PaymentChoice } from '@/components/publico/payment-choice';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { formatAmount } from '@/lib/utils';

type ServiceOption = {
  id: string;
  name: string;
  priceCents: number;
  durationMin: number;
};

export type EditableAppointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string | null;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  paymentMethod: string;
  date: string;
  time: string;
  notes: string | null;
};

/**
 * Encaixe manual e edicao de agendamento.
 * Sem `appointment`, cria um novo ja confirmado. Com `appointment`, permite
 * mudar servico, horario e principalmente o valor antes do atendimento.
 */
export function AppointmentDialog({
  services,
  defaultDate,
  appointment,
  trigger,
}: {
  services: ServiceOption[];
  defaultDate: string;
  appointment?: EditableAppointment;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(appointment);
  const [open, setOpen] = React.useState(false);
  const [serviceId, setServiceId] = React.useState(
    appointment?.serviceId ?? services[0]?.id ?? '',
  );
  const [price, setPrice] = React.useState(
    appointment
      ? formatAmount(appointment.priceCents)
      : services[0]
        ? formatAmount(services[0].priceCents)
        : '',
  );
  const [duration, setDuration] = React.useState(
    String(appointment?.durationMin ?? services[0]?.durationMin ?? 30),
  );
  const [payment, setPayment] = React.useState(appointment?.paymentMethod ?? 'PIX');
  const [state, formAction] = useActionState(
    isEdit ? updateAppointmentAction : createAppointmentAction,
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

  function handleService(value: string) {
    setServiceId(value);
    const service = services.find((item) => item.id === value);
    if (service) {
      setPrice(formatAmount(service.priceCents));
      setDuration(String(service.durationMin));
    }
  }

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
          {isEdit ? <Pencil className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
          {isEdit ? 'Editar' : 'Novo agendamento'}
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isEdit ? 'Editar agendamento' : 'Novo agendamento'}
        description={
          isEdit
            ? 'Dá para mudar o serviço, o horário e o valor cobrado.'
            : 'Encaixe manual. Já entra como confirmado na sua agenda.'
        }
      >
        <form action={formAction} className="flex flex-col gap-4">
          {appointment ? <input type="hidden" name="id" value={appointment.id} /> : null}
          <FormField label="Cliente" htmlFor="customerName">
            <Input
              id="customerName"
              name="customerName"
              defaultValue={appointment?.customerName ?? ''}
              placeholder="Ex.: João Silva"
              required
              autoFocus
            />
          </FormField>

          <FormField label="WhatsApp" htmlFor="customerPhone" hint="Opcional">
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              defaultValue={appointment?.customerPhone ?? ''}
              placeholder="75 99999-9999"
            />
          </FormField>

          <FormField label="Serviço" htmlFor="serviceId">
            <Select
              id="serviceId"
              name="serviceId"
              value={serviceId}
              onChange={(e) => handleService(e.target.value)}
            >
              <option value="">Outro (digitar)</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} (R$ {formatAmount(service.priceCents)})
                </option>
              ))}
            </Select>
          </FormField>

          {!serviceId ? (
            <FormField label="Nome do serviço" htmlFor="serviceName">
              <Input
                id="serviceName"
                name="serviceName"
                defaultValue={appointment?.serviceName ?? ''}
                required
              />
            </FormField>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data" htmlFor="date">
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={appointment?.date ?? defaultDate}
                required
              />
            </FormField>
            <FormField label="Horário" htmlFor="time">
              <Input
                id="time"
                name="time"
                type="time"
                step={300}
                defaultValue={appointment?.time ?? ''}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Valor" htmlFor="price">
              <MoneyInput id="price" name="price" value={price} onValueChange={setPrice} />
            </FormField>
            <FormField label="Duração (min)" htmlFor="durationMin">
              <Input
                id="durationMin"
                name="durationMin"
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Forma de pagamento">
            <PaymentChoice value={payment} onChange={setPayment} />
          </FormField>

          <FormField label="Observação" htmlFor="notes" hint="Opcional">
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={appointment?.notes ?? ''}
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
            <SubmitButton>{isEdit ? 'Salvar' : 'Agendar'}</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
