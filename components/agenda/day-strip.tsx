import Link from 'next/link';

import { nextDays, WEEKDAY_SHORT_LABELS } from '@/lib/schedule';
import { zonedParts, toDateInput, MONTH_NAMES } from '@/lib/date';
import { cn } from '@/lib/utils';

/** Faixa de dias navegavel, otimizada para o polegar. */
export function DayStrip({
  selected,
  counts,
}: {
  /** "YYYY-MM-DD" do dia aberto. */
  selected: string;
  /** Quantidade de agendamentos por dia. */
  counts: Record<string, number>;
}) {
  const days = nextDays(21, new Date());

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
      {days.map((date) => {
        const key = toDateInput(date);
        const parts = zonedParts(date);
        const active = key === selected;
        const count = counts[key] ?? 0;

        return (
          <Link
            key={key}
            href={`/dashboard/agenda?dia=${key}`}
            className={cn(
              'relative flex min-w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            <span className="text-[11px] font-medium uppercase">
              {WEEKDAY_SHORT_LABELS[parts.weekday]}
            </span>
            <span className="text-lg font-semibold leading-none">{parts.day}</span>
            <span className="text-[10px] uppercase opacity-70">
              {MONTH_NAMES[parts.month - 1].slice(0, 3)}
            </span>
            {count > 0 ? (
              <span
                className={cn(
                  'absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                  active ? 'bg-card text-primary' : 'bg-primary text-primary-foreground',
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
