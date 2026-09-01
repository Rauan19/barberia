import { Card } from '@/components/ui/card';
import type { FinanceSummary } from '@/lib/analytics';
import { formatBRL } from '@/lib/utils';

export function MonthSummary({
  title,
  finance,
  cuts,
  ticketCents,
}: {
  title: string;
  finance: FinanceSummary;
  cuts: number;
  ticketCents: number;
}) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">{title}</p>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">💰 Cortes</dt>
          <dd className="font-medium tabular">{formatBRL(finance.cutIncomeCents)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">📥 Outras entradas</dt>
          <dd className="font-medium tabular">{formatBRL(finance.otherIncomeCents)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">📤 Despesas</dt>
          <dd className="font-medium tabular text-destructive">
            -{formatBRL(finance.expenseCents)}
          </dd>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
          <dt className="font-medium">💵 Saldo</dt>
          <dd className="text-lg font-semibold tabular text-success">
            {formatBRL(finance.balanceCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <dt>{cuts} cortes no mês</dt>
          <dd>ticket {formatBRL(ticketCents)}</dd>
        </div>
      </dl>
    </Card>
  );
}
