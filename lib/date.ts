/**
 * Helpers de data com fuso fixo do Brasil (America/Sao_Paulo).
 * Todas as datas sao gravadas como Date/UTC no banco, mas os intervalos
 * de "hoje", "este mes" etc. sao calculados no fuso do barbeiro.
 */

export const TIMEZONE = 'America/Sao_Paulo';

/** Offset do fuso em minutos para um instante (ex.: -180 para BRT). */
function tzOffsetMinutes(date: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

/** Componentes de calendario (ano/mes/dia) de um instante no fuso do Brasil. */
export function zonedParts(date: Date) {
  const shifted = new Date(date.getTime() + tzOffsetMinutes(date) * 60000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

/** Converte um horario local do Brasil para o instante UTC correspondente. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const offset = tzOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60000);
}

/** Inicio do dia (00:00 no Brasil) do instante informado. */
export function startOfDayBR(date: Date) {
  const { year, month, day } = zonedParts(date);
  return zonedTimeToUtc(year, month, day, 0, 0, 0, 0);
}

/** Fim do dia (23:59:59.999 no Brasil). */
export function endOfDayBR(date: Date) {
  const { year, month, day } = zonedParts(date);
  return zonedTimeToUtc(year, month, day, 23, 59, 59, 999);
}

export function addDaysBR(date: Date, days: number) {
  const { year, month, day } = zonedParts(date);
  return zonedTimeToUtc(year, month, day + days, 0, 0, 0, 0);
}

export function startOfMonthBR(year: number, month: number) {
  return zonedTimeToUtc(year, month, 1, 0, 0, 0, 0);
}

export function endOfMonthBR(year: number, month: number) {
  return new Date(startOfMonthBR(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1).getTime() - 1);
}

/** Converte "2026-08-31" (input type=date) para o instante correto no Brasil. */
export function dateInputToUtc(value: string, endOfDay = false) {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return endOfDay
    ? zonedTimeToUtc(y, m, d, 23, 59, 59, 999)
    : zonedTimeToUtc(y, m, d, 12, 0, 0, 0);
}

/** Converte um Date para "YYYY-MM-DD" no fuso do Brasil (para input type=date). */
export function toDateInput(date: Date) {
  const { year, month, day } = zonedParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatDateBR(date: Date) {
  const { year, month, day } = zonedParts(date);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

export function formatShortDateBR(date: Date) {
  const { month, day } = zonedParts(date);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** "Hoje", "Ontem", "3 dias" ou a data. */
export function relativeDayLabel(date: Date, now = new Date()) {
  const days = Math.round(
    (startOfDayBR(now).getTime() - startOfDayBR(date).getTime()) / 86400000,
  );
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 0) return formatDateBR(date);
  if (days < 30) return `${days} dias`;
  return formatDateBR(date);
}
