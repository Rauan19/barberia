import { Check, MessageCircle, Pencil, Trash2, UserX, X } from 'lucide-react';
import type { AppointmentStatus, PaymentMethod } from '@prisma/client';

import {
  deleteAppointmentAction,
  setAppointmentStatusAction,
} from '@/app/actions/agenda';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { CompleteDialog } from '@/components/agenda/complete-dialog';
import { AppointmentDialog } from '@/components/agenda/appointment-dialog';
import { PAYMENT_LABEL, STATUS_LABEL, STATUS_TONE } from '@/lib/labels';
import { formatBRL, formatPhone, cn } from '@/lib/utils';
import { minutesToLabel, minutesOfDayBR } from '@/lib/schedule';
import { toDateInput } from '@/lib/date';

export type AppointmentItem = {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string | null;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  source: string;
  notes: string | null;
};

export function AppointmentCard({
  appointment,
  services = [],
}: {
  appointment: AppointmentItem;
  /** Necessario para abrir a edicao do agendamento. */
  services?: { id: string; name: string; priceCents: number; durationMin: number }[];
}) {
  const start = minutesToLabel(minutesOfDayBR(appointment.startAt));
  const end = minutesToLabel(minutesOfDayBR(appointment.endAt));
  const pending = appointment.status === 'PENDING';
  const closed =
    appointment.status === 'DONE' ||
    appointment.status === 'CANCELED' ||
    appointment.status === 'NO_SHOW';

  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-4 transition-colors',
        pending ? 'border-primary/40 bg-primary/[0.04]' : 'border-border',
        closed && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-2">
          <span className="text-sm font-semibold tabular">{start}</span>
          <span className="text-[10px] text-muted-foreground tabular">{end}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{appointment.customerName}</p>
            <Badge variant={STATUS_TONE[appointment.status]}>
              {STATUS_LABEL[appointment.status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {appointment.serviceName} · {appointment.durationMin} min ·{' '}
            {PAYMENT_LABEL[appointment.paymentMethod]}
          </p>
          {appointment.notes ? (
            <p className="mt-1 text-xs text-muted-foreground">“{appointment.notes}”</p>
          ) : null}
        </div>

        <p className="shrink-0 text-base font-semibold tabular text-success">
          {formatBRL(appointment.priceCents)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {appointment.customerPhone ? (
          <a
            href={`https://wa.me/55${appointment.customerPhone}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {formatPhone(appointment.customerPhone)}
          </a>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {pending ? (
            <form action={setAppointmentStatusAction}>
              <input type="hidden" name="id" value={appointment.id} />
              <input type="hidden" name="status" value="CONFIRMED" />
              <Button type="submit" size="sm">
                <Check className="h-4 w-4" />
                Confirmar
              </Button>
            </form>
          ) : null}

          {appointment.status === 'CONFIRMED' || pending ? (
            <CompleteDialog
              appointmentId={appointment.id}
              customerName={appointment.customerName}
              serviceName={appointment.serviceName}
              priceCents={appointment.priceCents}
              paymentMethod={appointment.paymentMethod}
            />
          ) : null}

          {!closed && services.length > 0 ? (
            <AppointmentDialog
              services={services}
              defaultDate={toDateInput(appointment.startAt)}
              appointment={{
                id: appointment.id,
                customerName: appointment.customerName,
                customerPhone: appointment.customerPhone,
                serviceId: appointment.serviceId,
                serviceName: appointment.serviceName,
                priceCents: appointment.priceCents,
                durationMin: appointment.durationMin,
                paymentMethod: appointment.paymentMethod,
                date: toDateInput(appointment.startAt),
                time: minutesToLabel(minutesOfDayBR(appointment.startAt)),
                notes: appointment.notes,
              }}
              trigger={
                <Button size="sm" variant="outline" title="Editar agendamento">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          ) : null}

          {!closed ? (
            <>
              <form action={setAppointmentStatusAction}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="status" value="NO_SHOW" />
                <Button type="submit" size="sm" variant="outline" title="Cliente faltou">
                  <UserX className="h-4 w-4" />
                </Button>
              </form>

              <form action={setAppointmentStatusAction}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="status" value="CANCELED" />
                <ConfirmButton
                  size="sm"
                  variant="outline"
                  title="Cancelar"
                  className="text-destructive hover:bg-destructive/10"
                  message={`Cancelar o agendamento de ${appointment.customerName}?`}
                >
                  <X className="h-4 w-4" />
                </ConfirmButton>
              </form>
            </>
          ) : (
            <form action={deleteAppointmentAction}>
              <input type="hidden" name="id" value={appointment.id} />
              <ConfirmButton
                size="sm"
                variant="ghost"
                title="Remover da agenda"
                className="text-destructive hover:bg-destructive/10"
                message={`Remover o agendamento de ${appointment.customerName} da agenda?`}
              >
                <Trash2 className="h-4 w-4" />
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
