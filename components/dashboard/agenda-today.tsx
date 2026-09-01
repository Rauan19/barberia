import Link from 'next/link';
import { ArrowRight, CalendarClock, Clock } from 'lucide-react';
import type { AppointmentStatus, PaymentMethod } from '@prisma/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { STATUS_LABEL, STATUS_TONE, PAYMENT_LABEL } from '@/lib/labels';
import { minutesToLabel, minutesOfDayBR } from '@/lib/schedule';
import { formatBRL } from '@/lib/utils';

export type AgendaTodayItem = {
  id: string;
  customerName: string;
  serviceName: string;
  priceCents: number;
  startAt: Date;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
};

/** Próximos atendimentos de hoje, com destaque para os que aguardam confirmação. */
export function AgendaToday({
  appointments,
  pendingCount,
}: {
  appointments: AgendaTodayItem[];
  pendingCount: number;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Agenda de hoje
          {pendingCount > 0 ? (
            <Badge variant="default">{pendingCount} a confirmar</Badge>
          ) : null}
        </CardTitle>
        <Link
          href="/dashboard/agenda"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver agenda <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-6 w-6" />}
            title="Nenhum atendimento hoje"
            description="Compartilhe seu link de agendamento para encher a agenda."
          />
        ) : (
          <ul className="divide-y divide-border">
            {appointments.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-semibold tabular">
                    {minutesToLabel(minutesOfDayBR(item.startAt))}
                  </span>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.serviceName} · {PAYMENT_LABEL[item.paymentMethod]}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular text-success">
                    {formatBRL(item.priceCents)}
                  </p>
                  <Badge variant={STATUS_TONE[item.status]} className="mt-0.5">
                    {STATUS_LABEL[item.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
