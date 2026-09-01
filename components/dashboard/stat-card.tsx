import * as React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon,
  change,
  tone = 'default',
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  /** Variacao percentual comparada ao periodo anterior. */
  change?: number | null;
  tone?: 'default' | 'success' | 'danger';
  /** Versao estreita, para caber tres lado a lado no celular. */
  compact?: boolean;
}) {
  // "vs ontem" sozinho nao diz nada: so aparece junto da variacao.
  const showHint = hint && (change === undefined || typeof change === 'number');

  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-destructive',
  }[tone];

  return (
    <Card className={compact ? 'px-2.5 py-3 sm:p-4' : 'p-4'}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-muted-foreground', compact ? 'text-xs sm:text-sm' : 'text-sm')}>
          {label}
        </p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p
        className={cn(
          'mt-2 font-semibold tabular',
          compact ? 'text-base sm:text-2xl' : 'text-2xl',
          toneClass,
        )}
      >
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2">
        {typeof change === 'number' ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              change >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {change >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(change).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </span>
        ) : null}
        {showHint ? (
          <span className={cn('text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            {hint}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
