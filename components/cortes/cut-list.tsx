import Link from 'next/link';
import { Scissors } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PAYMENT_LABEL } from '@/lib/labels';
import { formatBRL } from '@/lib/utils';
import { formatDateBR, relativeDayLabel } from '@/lib/date';

export type CutListItem = {
  id: string;
  serviceName: string;
  priceCents: number;
  paymentMethod: keyof typeof PAYMENT_LABEL;
  performedAt: Date;
  client: { id: string; name: string } | null;
};

export function CutList({
  cuts,
  relative = false,
  action,
}: {
  cuts: CutListItem[];
  /** Mostra "Hoje"/"Ontem" no lugar da data completa. */
  relative?: boolean;
  action?: (cut: CutListItem) => React.ReactNode;
}) {
  return (
    <ul className="divide-y divide-border">
      {cuts.map((cut) => (
        <li key={cut.id} className="flex items-center gap-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Scissors className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {cut.client ? (
                <Link
                  href={`/dashboard/clientes/${cut.client.id}`}
                  className="hover:underline"
                >
                  {cut.client.name}
                </Link>
              ) : (
                'Cliente avulso'
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {cut.serviceName} ·{' '}
              {relative ? relativeDayLabel(cut.performedAt) : formatDateBR(cut.performedAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold tabular text-success">
                {formatBRL(cut.priceCents)}
              </p>
              <Badge variant="muted" className="mt-0.5">
                {PAYMENT_LABEL[cut.paymentMethod]}
              </Badge>
            </div>
            {action ? action(cut) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
