import Link from 'next/link';
import { CalendarDays, Clock, Settings2, Share2 } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfDayBR, endOfDayBR, toDateInput, formatDateBR, dateInputToUtc } from '@/lib/date';
import { WEEKDAY_LABELS, minutesToLabel } from '@/lib/schedule';
import { zonedParts } from '@/lib/date';
import { formatBRL } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { DayStrip } from '@/components/agenda/day-strip';
import { AppointmentCard } from '@/components/agenda/appointment-card';
import { AppointmentDialog } from '@/components/agenda/appointment-dialog';
import { SetupBanner } from '@/components/agenda/setup-banner';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const selectedDate = params.dia ? dateInputToUtc(params.dia) : new Date();
  const day = selectedDate ?? new Date();
  const dayKey = toDateInput(day);
  const dayStart = startOfDayBR(day);
  const dayEnd = endOfDayBR(day);

  const [appointments, pending, services, workingHour, blocks, upcoming, account] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { userId, startAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { startAt: 'asc' },
      }),
      prisma.appointment.findMany({
        where: { userId, status: 'PENDING', endAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' },
      }),
      prisma.service.findMany({
        where: { userId, active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, priceCents: true, durationMin: true },
      }),
      prisma.workingHour.findUnique({
        where: { userId_weekday: { userId, weekday: zonedParts(day).weekday } },
      }),
      prisma.timeBlock.findMany({
        where: { userId, startAt: { lte: dayEnd }, endAt: { gte: dayStart } },
        orderBy: { startAt: 'asc' },
      }),
      prisma.appointment.groupBy({
        by: ['startAt'],
        where: {
          userId,
          status: { in: ['PENDING', 'CONFIRMED', 'DONE'] },
          startAt: { gte: startOfDayBR(new Date()) },
        },
        _count: { _all: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { scheduleConfigured: true },
      }),
    ]);

  const counts: Record<string, number> = {};
  for (const row of upcoming) {
    const key = toDateInput(row.startAt);
    counts[key] = (counts[key] ?? 0) + row._count._all;
  }

  const dayTotal = appointments
    .filter((item) => item.status !== 'CANCELED')
    .reduce((sum, item) => sum + item.priceCents, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Agenda"
        description="Confirme, encaixe e feche os atendimentos do dia."
        action={<AppointmentDialog services={services} defaultDate={dayKey} />}
      />

      {account && !account.scheduleConfigured ? <SetupBanner /> : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/agenda/horarios"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Settings2 className="h-4 w-4" />
          Horários e bloqueios
        </Link>
        <Link
          href="/dashboard/configuracoes#pagina-publica"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Share2 className="h-4 w-4" />
          Link de agendamento
        </Link>
      </div>

      {pending.length > 0 ? (
        <Card className="border-primary/40">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Aguardando sua confirmação
              <Badge variant="default">{pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pending.map((appointment) => (
              <div key={appointment.id}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {formatDateBR(appointment.startAt)}
                </p>
                <AppointmentCard appointment={appointment} services={services} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <DayStrip selected={dayKey} counts={counts} />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{formatDateBR(day)}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {WEEKDAY_LABELS[zonedParts(day).weekday]}
              {workingHour?.open
                ? ` · ${minutesToLabel(workingHour.startMinute)} às ${minutesToLabel(workingHour.endMinute)}`
                : ' · fechado'}
            </p>
          </div>
          {dayTotal > 0 ? (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Previsto</p>
              <p className="text-lg font-semibold tabular text-success">
                {formatBRL(dayTotal)}
              </p>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {block.allDay
                  ? 'Dia bloqueado'
                  : `Bloqueado ${minutesToLabel(
                      Math.round((block.startAt.getTime() - dayStart.getTime()) / 60000),
                    )} às ${minutesToLabel(
                      Math.round((block.endAt.getTime() - dayStart.getTime()) / 60000),
                    )}`}
                {block.reason ? ` · ${block.reason}` : ''}
              </span>
            </div>
          ))}

          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                services={services}
              />
            ))
          ) : blocks.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="Nenhum agendamento nesse dia"
              description="Encaixe um cliente ou compartilhe seu link de agendamento."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
