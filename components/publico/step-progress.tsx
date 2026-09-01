'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export const STEP_LABELS = ['Serviço', 'Dia', 'Horário', 'Seus dados'];

/** Trilha de progresso do agendamento. Toca num passo já feito para voltar. */
export function StepProgress({
  current,
  furthest,
  onJump,
}: {
  current: number;
  /** Passo mais avancado ja alcancado: so ate ele da para pular. */
  furthest: number;
  onJump: (step: number) => void;
}) {
  return (
    <nav aria-label="Etapas do agendamento" className="flex items-center gap-1">
      {STEP_LABELS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        const reachable = index <= furthest;

        return (
          <div key={label} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(index)}
              aria-current={active ? 'step' : undefined}
              className="group flex flex-1 flex-col items-center gap-1.5 disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  active && 'border-amber-400 bg-amber-400 text-zinc-950',
                  done && 'border-amber-400/60 bg-amber-400/15 text-amber-300',
                  !active && !done && 'border-white/15 text-zinc-500',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-wide transition-colors',
                  active ? 'text-amber-300' : done ? 'text-zinc-400' : 'text-zinc-600',
                )}
              >
                {label}
              </span>
            </button>
            {index < STEP_LABELS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  '-mt-4 h-0.5 w-full flex-1 rounded-full transition-colors',
                  done ? 'bg-amber-400/50' : 'bg-white/10',
                )}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
