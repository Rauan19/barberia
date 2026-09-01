import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type RankingRow = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  href?: string;
};

export function RankingList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: RankingRow[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {rows.map((row, index) => {
              const content = (
                <>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {row.label}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular">{row.value}</span>
                  {row.hint ? (
                    <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular">
                      {row.hint}
                    </span>
                  ) : null}
                </>
              );

              return (
                <li key={row.id}>
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="flex items-center gap-3 rounded-md py-0.5 hover:underline"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
