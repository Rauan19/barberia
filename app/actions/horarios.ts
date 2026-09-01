'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { labelToMinutes } from '@/lib/schedule';
import { zonedTimeToUtc } from '@/lib/date';
import { fail, succeed, type ActionState } from '@/lib/action-state';

function revalidateSchedule() {
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard/agenda/horarios');
}

/** Salva a agenda semanal inteira de uma vez. */
export async function saveWorkingHoursAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const updates = [];

  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const open = formData.get(`open-${weekday}`) === 'on';
    const startMinute = labelToMinutes(String(formData.get(`start-${weekday}`) ?? ''));
    const endMinute = labelToMinutes(String(formData.get(`end-${weekday}`) ?? ''));
    const breakStartRaw = String(formData.get(`breakStart-${weekday}`) ?? '');
    const breakEndRaw = String(formData.get(`breakEnd-${weekday}`) ?? '');
    const breakStart = breakStartRaw ? labelToMinutes(breakStartRaw) : null;
    const breakEnd = breakEndRaw ? labelToMinutes(breakEndRaw) : null;

    if (open) {
      if (startMinute === null || endMinute === null) {
        return fail('Preencha abertura e fechamento dos dias marcados como abertos.');
      }
      if (endMinute <= startMinute) {
        return fail('O fechamento precisa ser depois da abertura.');
      }
      if (breakStart !== null && breakEnd !== null && breakEnd <= breakStart) {
        return fail('O fim do intervalo precisa ser depois do início.');
      }
    }

    updates.push({
      weekday,
      open,
      startMinute: startMinute ?? 9 * 60,
      endMinute: endMinute ?? 19 * 60,
      breakStart: breakStart !== null && breakEnd !== null ? breakStart : null,
      breakEnd: breakStart !== null && breakEnd !== null ? breakEnd : null,
    });
  }

  const slotMinutes = Number(formData.get('slotMinutes') ?? 30) || 30;
  const bookingDays = Number(formData.get('bookingDays') ?? 14) || 14;
  const bookingOpen = formData.get('bookingOpen') === 'on';
  const hasOpenDay = updates.some((day) => day.open);

  if (!hasOpenDay && bookingOpen) {
    return fail('Marque ao menos um dia de trabalho para aceitar agendamentos.');
  }

  await prisma.$transaction([
    ...updates.map((data) =>
      prisma.workingHour.upsert({
        where: { userId_weekday: { userId, weekday: data.weekday } },
        update: data,
        create: { userId, ...data },
      }),
    ),
    prisma.user.update({
      where: { id: userId },
      data: {
        slotMinutes: Math.min(120, Math.max(5, slotMinutes)),
        bookingDays: Math.min(90, Math.max(1, bookingDays)),
        bookingOpen,
        scheduleConfigured: hasOpenDay,
      },
    }),
  ]);

  revalidateSchedule();
  return succeed('Agenda salva!');
}

const setupSchedule = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Escolha os dias em que você trabalha'),
  startMinute: z.number().int(),
  endMinute: z.number().int(),
  breakStart: z.number().int().nullable(),
  breakEnd: z.number().int().nullable(),
  slotMinutes: z.number().int(),
});

/**
 * Montador de agenda: aplica os mesmos horarios aos dias escolhidos de uma vez.
 * E o passo que liga o agendamento online. Antes dele, ninguem consegue marcar.
 */
export async function setupScheduleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const hasBreak = formData.get('hasBreak') === 'on';
  const breakStart = hasBreak ? labelToMinutes(String(formData.get('breakStart') ?? '')) : null;
  const breakEnd = hasBreak ? labelToMinutes(String(formData.get('breakEnd') ?? '')) : null;

  const parsed = setupSchedule.safeParse({
    weekdays: formData.getAll('weekdays').map(Number),
    startMinute: labelToMinutes(String(formData.get('startMinute') ?? '')) ?? -1,
    endMinute: labelToMinutes(String(formData.get('endMinute') ?? '')) ?? -1,
    breakStart,
    breakEnd,
    slotMinutes: Number(formData.get('slotMinutes') ?? 30) || 30,
  });

  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { weekdays, startMinute, endMinute } = parsed.data;

  if (startMinute < 0 || endMinute < 0) return fail('Informe o horário de abertura e fechamento.');
  if (endMinute <= startMinute) return fail('O fechamento precisa ser depois da abertura.');
  if (hasBreak) {
    if (breakStart === null || breakEnd === null) return fail('Informe o início e o fim do intervalo.');
    if (breakEnd <= breakStart) return fail('O fim do intervalo precisa ser depois do início.');
    if (breakStart < startMinute || breakEnd > endMinute) {
      return fail('O intervalo precisa estar dentro do horário de trabalho.');
    }
  }

  const selected = new Set(weekdays);

  await prisma.$transaction([
    ...[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
      const open = selected.has(weekday);
      const data = {
        weekday,
        open,
        startMinute,
        endMinute,
        breakStart: open && hasBreak ? breakStart : null,
        breakEnd: open && hasBreak ? breakEnd : null,
      };
      return prisma.workingHour.upsert({
        where: { userId_weekday: { userId, weekday } },
        update: data,
        create: { userId, ...data },
      });
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        slotMinutes: Math.min(120, Math.max(5, parsed.data.slotMinutes)),
        scheduleConfigured: true,
        bookingOpen: true,
      },
    }),
  ]);

  revalidateSchedule();
  revalidatePath('/dashboard');
  return succeed('Agenda criada! Sua página de agendamento já está no ar.');
}

const blockSchema = z.object({
  date: z.string().min(1, 'Informe a data'),
  allDay: z.boolean(),
  start: z.string().optional(),
  end: z.string().optional(),
  reason: z.string().optional(),
});

/** Bloqueia um dia inteiro ou um intervalo do dia. */
export async function createTimeBlockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = blockSchema.safeParse({
    date: String(formData.get('date') ?? '').trim(),
    allDay: formData.get('allDay') === 'on',
    start: String(formData.get('start') ?? '').trim() || undefined,
    end: String(formData.get('end') ?? '').trim() || undefined,
    reason: String(formData.get('reason') ?? '').trim() || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const [year, month, day] = parsed.data.date.split('-').map(Number);
  if (!year || !month || !day) return fail('Data inválida.');

  let startMinute = 0;
  let endMinute = 24 * 60;

  if (!parsed.data.allDay) {
    const start = labelToMinutes(parsed.data.start ?? '');
    const end = labelToMinutes(parsed.data.end ?? '');
    if (start === null || end === null) return fail('Informe o horário inicial e final.');
    if (end <= start) return fail('O fim do bloqueio precisa ser depois do início.');
    startMinute = start;
    endMinute = end;
  }

  await prisma.timeBlock.create({
    data: {
      userId,
      allDay: parsed.data.allDay,
      reason: parsed.data.reason ?? null,
      startAt: zonedTimeToUtc(year, month, day, Math.floor(startMinute / 60), startMinute % 60),
      endAt: zonedTimeToUtc(year, month, day, Math.floor(endMinute / 60), endMinute % 60),
    },
  });

  revalidateSchedule();
  return succeed('Bloqueio criado!');
}

export async function deleteTimeBlockAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  await prisma.timeBlock.deleteMany({ where: { id, userId } });
  revalidateSchedule();
}
