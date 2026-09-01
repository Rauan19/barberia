import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBRL } from '@/lib/utils';

export type BreakdownRow = { label: string; totalCents: number; emoji?: string };

export function Breakdown({
  title,
  rows,
  emptyLabel,
  tone = 'default',
}: {
  title: string;
  rows: BreakdownRow[];
  emptyLabel: string;
  tone?: 'default' | 'danger';
}) {
  const total = rows.reduce((sum, row) => sum + row.totalCents, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const percent = total > 0 ? (row.totalCents / total) * 100 : 0;
              return (
                <li key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      {row.emoji ? <span aria-hidden>{row.emoji}</span> : null}
                      {row.label}
                    </span>
                    <span className="font-medium tabular">{formatBRL(row.totalCents)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={
                        tone === 'danger'
                          ? 'h-full rounded-full bg-destructive'
                          : 'h-full rounded-full bg-primary'
                      }
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
