import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteTimeBlockAction } from '@/app/actions/horarios';
import { EMPTY_WORKING_HOURS, minutesToLabel } from '@/lib/schedule';
import { formatDateBR, startOfDayBR } from '@/lib/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { ScheduleSetup } from '@/components/agenda/schedule-setup';
import { WorkingHoursForm } from '@/components/agenda/working-hours-form';
import { BlockForm } from '@/components/agenda/block-form';

export const dynamic = 'force-dynamic';

export default async function HorariosPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      slotMinutes: true,
      bookingDays: true,
      bookingOpen: true,
      scheduleConfigured: true,
      workingHours: { orderBy: { weekday: 'asc' } },
    },
  });
  if (!user) redirect('/login');

  // Conta criada antes da agenda existir: comeca vazia, sem assumir dias.
  if (user.workingHours.length === 0) {
    await prisma.workingHour.createMany({
      data: EMPTY_WORKING_HOURS.map((hour) => ({ ...hour, userId })),
    });
  }

  const hours =
    user.workingHours.length > 0
      ? user.workingHours
      : EMPTY_WORKING_HOURS.map((hour) => ({ ...hour, id: '', userId }));

  const blocks = await prisma.timeBlock.findMany({
    where: { userId, endAt: { gte: startOfDayBR(new Date()) } },
    orderBy: { startAt: 'asc' },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/dashboard/agenda"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Agenda
      </Link>

      <PageHeader
        title="Horários e bloqueios"
        description="Sua semana de trabalho e as folgas pontuais."
      />

      <ScheduleSetup
        configured={user.scheduleConfigured}
        slotMinutes={user.slotMinutes}
      />

      <WorkingHoursForm
        hours={hours.map((hour) => ({
          weekday: hour.weekday,
          open: hour.open,
          startMinute: hour.startMinute,
          endMinute: hour.endMinute,
          breakStart: hour.breakStart,
          breakEnd: hour.breakEnd,
        }))}
        slotMinutes={user.slotMinutes}
        bookingDays={user.bookingDays}
        bookingOpen={user.bookingOpen}
      />

      <BlockForm />

      <Card>
        <CardHeader>
          <CardTitle>Bloqueios ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <EmptyState
              title="Nenhum bloqueio"
              description="Seus horários seguem a agenda semanal."
            />
          ) : (
            <ul className="divide-y divide-border">
              {blocks.map((block) => {
                const dayStart = startOfDayBR(block.startAt);
                const startMin = Math.round(
                  (block.startAt.getTime() - dayStart.getTime()) / 60000,
                );
                const endMin = Math.round((block.endAt.getTime() - dayStart.getTime()) / 60000);

                return (
                  <li key={block.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{formatDateBR(block.startAt)}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {block.allDay
                          ? 'Dia inteiro'
                          : `${minutesToLabel(startMin)} às ${minutesToLabel(endMin)}`}
                        {block.reason ? ` · ${block.reason}` : ''}
                      </p>
                    </div>
                    <form action={deleteTimeBlockAction}>
                      <input type="hidden" name="id" value={block.id} />
                      <ConfirmButton
                        variant="ghost"
                        size="icon"
                        title="Remover bloqueio"
                        className="text-destructive hover:bg-destructive/10"
                        message="Remover esse bloqueio?"
                      >
                        <Trash2 className="h-4 w-4" />
                      </ConfirmButton>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
