import 'server-only';

import { prisma } from '@/lib/db';
import { startOfDayBR, endOfDayBR, zonedParts } from '@/lib/date';
import { buildDaySlots, type Slot, type WorkingHourLike } from '@/lib/schedule';

/**
 * Status que ocupam o horario na agenda.
 * Um atendimento concluido tambem ocupa: o barbeiro esteve ocupado ali.
 * Só cancelamento e falta liberam o horario.
 */
export const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED', 'DONE'] as const;

export type BarberScheduleConfig = {
  id: string;
  slotMinutes: number;
  workingHours: WorkingHourLike[];
};

/**
 * Horarios livres de um dia para um barbeiro.
 * Considera expediente, intervalo, bloqueios e agendamentos ja marcados.
 */
export async function availableSlots({
  barber,
  day,
  durationMin,
  ignoreAppointmentId,
  now = new Date(),
  minimumNoticeMin = 0,
}: {
  barber: BarberScheduleConfig;
  day: Date;
  durationMin: number;
  ignoreAppointmentId?: string;
  now?: Date;
  minimumNoticeMin?: number;
}): Promise<Slot[]> {
  const dayStart = startOfDayBR(day);
  const dayEnd = endOfDayBR(day);
  const { weekday } = zonedParts(day);

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId: barber.id,
        status: { in: [...BLOCKING_STATUSES] },
        startAt: { lte: dayEnd },
        endAt: { gte: dayStart },
        ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
      },
      select: { startAt: true, endAt: true },
    }),
    prisma.timeBlock.findMany({
      where: {
        userId: barber.id,
        startAt: { lte: dayEnd },
        endAt: { gte: dayStart },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  return buildDaySlots({
    day,
    workingHour: barber.workingHours.find((hour) => hour.weekday === weekday),
    durationMin,
    stepMin: barber.slotMinutes,
    busy: [...appointments, ...blocks],
    now,
    minimumNoticeMin,
  });
}

/** Confere se um horario especifico continua livre. Usado antes de gravar. */
export async function isSlotFree({
  barber,
  startAt,
  durationMin,
  ignoreAppointmentId,
  now = new Date(),
}: {
  barber: BarberScheduleConfig;
  startAt: Date;
  durationMin: number;
  ignoreAppointmentId?: string;
  now?: Date;
}) {
  const slots = await availableSlots({
    barber,
    day: startAt,
    durationMin,
    ignoreAppointmentId,
    now,
  });
  return slots.some((slot) => slot.startAt.getTime() === startAt.getTime());
}

/** Config de agenda do barbeiro pelo slug publico. */
export async function barberBySlug(slug: string) {
  return prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      barbershop: true,
      slug: true,
      phone: true,
      address: true,
      bio: true,
      slotMinutes: true,
      bookingDays: true,
      bookingOpen: true,
      logoMime: true,
      workingHours: {
        select: {
          weekday: true,
          open: true,
          startMinute: true,
          endMinute: true,
          breakStart: true,
          breakEnd: true,
        },
        orderBy: { weekday: 'asc' },
      },
    },
  });
}
