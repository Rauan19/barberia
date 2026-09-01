import {
  addDaysBR,
  endOfDayBR,
  endOfMonthBR,
  startOfDayBR,
  startOfMonthBR,
  zonedParts,
  dateInputToUtc,
  MONTH_NAMES,
} from '@/lib/date';

export type PeriodPreset = 'hoje' | '7dias' | '30dias' | 'mes' | 'mes-anterior' | 'ano' | 'custom';

export type Period = {
  preset: PeriodPreset;
  start: Date;
  end: Date;
  label: string;
  /** Periodo imediatamente anterior, de mesma duracao, para comparacao. */
  previousStart: Date;
  previousEnd: Date;
};

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
  { value: 'mes', label: 'Este mês' },
  { value: 'mes-anterior', label: 'Mês anterior' },
  { value: 'ano', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
];

function previousOf(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime();
  return {
    previousStart: new Date(start.getTime() - duration - 1),
    previousEnd: new Date(start.getTime() - 1),
  };
}

export function resolvePeriod(
  preset: string | undefined,
  from?: string,
  to?: string,
  now = new Date(),
): Period {
  const { year, month } = zonedParts(now);
  const value = (preset ?? 'mes') as PeriodPreset;

  if (value === 'custom' && from && to) {
    const start = dateInputToUtc(from) ?? startOfDayBR(now);
    const end = dateInputToUtc(to, true) ?? endOfDayBR(now);
    const startOfRange = startOfDayBR(start);
    return {
      preset: 'custom',
      start: startOfRange,
      end,
      label: 'Período personalizado',
      ...previousOf(startOfRange, end),
    };
  }

  switch (value) {
    case 'hoje': {
      const start = startOfDayBR(now);
      const end = endOfDayBR(now);
      return { preset: value, start, end, label: 'Hoje', ...previousOf(start, end) };
    }
    case '7dias': {
      const start = addDaysBR(now, -6);
      const end = endOfDayBR(now);
      return { preset: value, start, end, label: 'Últimos 7 dias', ...previousOf(start, end) };
    }
    case '30dias': {
      const start = addDaysBR(now, -29);
      const end = endOfDayBR(now);
      return { preset: value, start, end, label: 'Últimos 30 dias', ...previousOf(start, end) };
    }
    case 'mes-anterior': {
      const y = month === 1 ? year - 1 : year;
      const m = month === 1 ? 12 : month - 1;
      const start = startOfMonthBR(y, m);
      const end = endOfMonthBR(y, m);
      return {
        preset: value,
        start,
        end,
        label: `${MONTH_NAMES[m - 1]} de ${y}`,
        ...previousOf(start, end),
      };
    }
    case 'ano': {
      const start = startOfMonthBR(year, 1);
      const end = endOfMonthBR(year, 12);
      return { preset: value, start, end, label: `${year}`, ...previousOf(start, end) };
    }
    case 'mes':
    default: {
      const start = startOfMonthBR(year, month);
      const end = endOfMonthBR(year, month);
      return {
        preset: 'mes',
        start,
        end,
        label: `${MONTH_NAMES[month - 1]} de ${year}`,
        ...previousOf(start, end),
      };
    }
  }
}

/** Monta a query string preservando o periodo selecionado. */
export function periodQuery(period: Period, extra: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  params.set('periodo', period.preset);
  if (period.preset === 'custom') {
    params.set('de', period.start.toISOString().slice(0, 10));
    params.set('ate', period.end.toISOString().slice(0, 10));
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
