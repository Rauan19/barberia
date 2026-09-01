import { zonedParts, zonedTimeToUtc, startOfDayBR, endOfDayBR } from '@/lib/date';

/** "09:00" a partir de minutos desde a meia-noite. */
export function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "09:30" -> 570. Retorna null quando invalido. */
export function labelToMinutes(label: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Hora do dia (em minutos) de um instante, no fuso do Brasil. */
export function minutesOfDayBR(date: Date) {
  const start = startOfDayBR(date);
  return Math.round((date.getTime() - start.getTime()) / 60000);
}

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const WEEKDAY_SHORT_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Agenda de quem acabou de criar a conta: **todos os dias fechados**.
 * O app nao promete o horario de ninguem: o barbeiro escolhe os dias
 * antes de a pagina publica aceitar qualquer agendamento.
 */
export const EMPTY_WORKING_HOURS = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  open: false,
  startMinute: 9 * 60,
  endMinute: 19 * 60,
  breakStart: null as number | null,
  breakEnd: null as number | null,
}));

/** Sugestao mostrada no montador de agenda. Nada disso e aplicado sozinho. */
export const SUGGESTED_SCHEDULE = {
  weekdays: [1, 2, 3, 4, 5, 6],
  startMinute: 9 * 60,
  endMinute: 19 * 60,
  breakStart: 12 * 60,
  breakEnd: 13 * 60,
};

export type Interval = { start: number; end: number };

export type WorkingHourLike = {
  weekday: number;
  open: boolean;
  startMinute: number;
  endMinute: number;
  breakStart: number | null;
  breakEnd: number | null;
};

export type BusyInterval = { startAt: Date; endAt: Date };

export type Slot = {
  /** Minutos desde a meia-noite, no fuso do Brasil. */
  minute: number;
  label: string;
  startAt: Date;
  endAt: Date;
};

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Horarios livres de um dia.
 *
 * Um horario entra na lista quando cabe inteiro dentro do expediente e nao
 * encosta em intervalo, bloqueio ou agendamento ja existente.
 */
export function buildDaySlots({
  day,
  workingHour,
  durationMin,
  stepMin,
  busy,
  now = new Date(),
  minimumNoticeMin = 0,
}: {
  /** Qualquer instante dentro do dia desejado. */
  day: Date;
  workingHour: WorkingHourLike | undefined;
  durationMin: number;
  stepMin: number;
  busy: BusyInterval[];
  now?: Date;
  minimumNoticeMin?: number;
}): Slot[] {
  if (!workingHour || !workingHour.open) return [];
  if (durationMin <= 0 || stepMin <= 0) return [];

  const { year, month, day: dayOfMonth } = zonedParts(day);
  const dayStart = startOfDayBR(day);
  const dayEnd = endOfDayBR(day);

  const blocked: Interval[] = [];

  if (workingHour.breakStart !== null && workingHour.breakEnd !== null) {
    blocked.push({ start: workingHour.breakStart, end: workingHour.breakEnd });
  }

  for (const item of busy) {
    // Recorta o compromisso ao dia analisado.
    const start = Math.max(
      0,
      Math.round((Math.max(item.startAt.getTime(), dayStart.getTime()) - dayStart.getTime()) / 60000),
    );
    const end = Math.min(
      1440,
      Math.round((Math.min(item.endAt.getTime(), dayEnd.getTime() + 1) - dayStart.getTime()) / 60000),
    );
    if (end > start) blocked.push({ start, end });
  }

  const nowMinutes =
    startOfDayBR(now).getTime() === dayStart.getTime()
      ? minutesOfDayBR(now) + minimumNoticeMin
      : -1;

  const slots: Slot[] = [];

  for (
    let minute = workingHour.startMinute;
    minute + durationMin <= workingHour.endMinute;
    minute += stepMin
  ) {
    const candidate = { start: minute, end: minute + durationMin };
    if (minute < nowMinutes) continue;
    if (blocked.some((interval) => overlaps(candidate, interval))) continue;

    slots.push({
      minute,
      label: minutesToLabel(minute),
      startAt: zonedTimeToUtc(year, month, dayOfMonth, Math.floor(minute / 60), minute % 60),
      endAt: zonedTimeToUtc(
        year,
        month,
        dayOfMonth,
        Math.floor((minute + durationMin) / 60),
        (minute + durationMin) % 60,
      ),
    });
  }

  return slots;
}

/** Gera os proximos N dias a partir de hoje, no fuso do Brasil. */
export function nextDays(count: number, from = new Date()) {
  const { year, month, day } = zonedParts(from);
  return Array.from({ length: count }, (_, index) =>
    zonedTimeToUtc(year, month, day + index, 12, 0, 0, 0),
  );
}
