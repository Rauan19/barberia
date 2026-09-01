import { Target, Trash2 } from 'lucide-react';

import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cutStats } from '@/lib/analytics';
import { deleteGoalAction } from '@/app/actions/metas';
import { endOfMonthBR, startOfMonthBR, zonedParts, MONTH_NAMES } from '@/lib/date';
import { formatBRL } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { ProgressBar } from '@/components/dashboard/progress-bar';
import { GoalForm } from '@/components/metas/goal-form';

export const dynamic = 'force-dynamic';

export default async function MetasPage() {
  const userId = await requireUserId();
  const now = zonedParts(new Date());

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 12,
  });

  const progress = await Promise.all(
    goals.map(async (goal) => {
      const stats = await cutStats(
        userId,
        startOfMonthBR(goal.year, goal.month),
        endOfMonthBR(goal.year, goal.month),
      );
      return { goal, stats };
    }),
  );

  const currentGoal = goals.find((g) => g.year === now.year && g.month === now.month);
  const years = Array.from({ length: 3 }, (_, i) => now.year - 1 + i);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Metas"
        description="Defina quanto quer faturar e quantos cortes quer fazer no mês."
      />

      <GoalForm
        year={now.year}
        month={now.month}
        years={years}
        current={currentGoal ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>Acompanhamento</CardTitle>
        </CardHeader>
        <CardContent>
          {progress.length === 0 ? (
            <EmptyState
              icon={<Target className="h-6 w-6" />}
              title="Nenhuma meta definida"
              description="Defina a meta do mês acima para acompanhar o progresso."
            />
          ) : (
            <ul className="flex flex-col gap-5">
              {progress.map(({ goal, stats }) => {
                const revenuePercent =
                  goal.revenueTarget > 0
                    ? (stats.revenueCents / goal.revenueTarget) * 100
                    : 0;
                const cutsPercent =
                  goal.cutsTarget > 0 ? (stats.count / goal.cutsTarget) * 100 : 0;

                return (
                  <li key={`${goal.year}-${goal.month}`} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {MONTH_NAMES[goal.month - 1]} de {goal.year}
                      </p>
                      <form action={deleteGoalAction}>
                        <input type="hidden" name="year" value={goal.year} />
                        <input type="hidden" name="month" value={goal.month} />
                        <ConfirmButton
                          variant="ghost"
                          size="icon"
                          title="Remover meta"
                          className="text-destructive hover:bg-destructive/10"
                          message={`Remover a meta de ${MONTH_NAMES[goal.month - 1]}?`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ConfirmButton>
                      </form>
                    </div>

                    {goal.revenueTarget > 0 ? (
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Faturamento</span>
                          <span className="tabular">
                            {formatBRL(stats.revenueCents)} / {formatBRL(goal.revenueTarget)}
                          </span>
                        </div>
                        <ProgressBar percent={revenuePercent} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {revenuePercent.toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })}
                          %
                          {stats.revenueCents < goal.revenueTarget
                            ? `. Faltam ${formatBRL(goal.revenueTarget - stats.revenueCents)}`
                            : '. Meta batida 🏆'}
                        </p>
                      </div>
                    ) : null}

                    {goal.cutsTarget > 0 ? (
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Cortes</span>
                          <span className="tabular">
                            {stats.count} / {goal.cutsTarget}
                          </span>
                        </div>
                        <ProgressBar percent={cutsPercent} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cutsPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                          {stats.count < goal.cutsTarget
                            ? `. Faltam ${goal.cutsTarget - stats.count} cortes`
                            : '. Meta batida 🏆'}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
