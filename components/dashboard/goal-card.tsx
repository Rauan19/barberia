import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/dashboard/progress-bar';
import { formatBRL } from '@/lib/utils';

type Goal = {
  revenueTarget: number;
  cutsTarget: number;
  revenueCents: number;
  cuts: number;
  revenuePercent: number;
  cutsPercent: number;
};

export function GoalCard({ goal }: { goal: Goal | null }) {
  if (!goal) {
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold">🎯 Meta do mês</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina uma meta para acompanhar quanto falta para bater o mês.
        </p>
        <Link
          href="/dashboard/metas"
          className="mt-3 inline-flex h-8 items-center rounded-md border border-input bg-card px-3 text-xs font-medium hover:bg-accent"
        >
          Definir meta
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">🎯 Meta do mês</p>
        <Link href="/dashboard/metas" className="text-xs text-primary hover:underline">
          Editar
        </Link>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{formatBRL(goal.revenueCents)}</span>
            <span>{formatBRL(goal.revenueTarget)}</span>
          </div>
          <ProgressBar percent={goal.revenuePercent} />
          <p className="mt-1 text-xs font-medium">
            {goal.revenuePercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do
            faturamento
          </p>
        </div>
        {goal.cutsTarget > 0 ? (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{goal.cuts} cortes</span>
              <span>{goal.cutsTarget} cortes</span>
            </div>
            <ProgressBar percent={goal.cutsPercent} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
