import { Lock, Pencil, Trash2 } from 'lucide-react';

import { deleteTransactionAction } from '@/app/actions/financeiro';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { TransactionDialog } from '@/components/financeiro/transaction-dialog';
import { CATEGORY_EMOJI, CATEGORY_LABEL, PAYMENT_LABEL } from '@/lib/labels';
import { formatBRL } from '@/lib/utils';
import { formatDateBR, toDateInput } from '@/lib/date';
import type { PaymentMethod, TransactionCategory, TransactionType } from '@prisma/client';

export type TransactionItem = {
  id: string;
  type: TransactionType;
  description: string;
  category: TransactionCategory;
  amountCents: number;
  paymentMethod: PaymentMethod;
  date: Date;
  notes: string | null;
  cutId: string | null;
};

export function TransactionList({ transactions }: { transactions: TransactionItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {transactions.map((tx) => {
        const income = tx.type === 'INCOME';
        return (
          <li key={tx.id} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-base">
              {CATEGORY_EMOJI[tx.category]}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tx.description}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDateBR(tx.date)} · {CATEGORY_LABEL[tx.category]} ·{' '}
                {PAYMENT_LABEL[tx.paymentMethod]}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={`text-sm font-semibold tabular ${
                  income ? 'text-success' : 'text-destructive'
                }`}
              >
                {income ? '+' : '-'}
                {formatBRL(tx.amountCents)}
              </p>
              {tx.cutId ? (
                <Badge variant="muted" className="mt-0.5">
                  <Lock className="h-3 w-3" /> corte
                </Badge>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {tx.cutId ? (
                <span
                  aria-hidden
                  className="w-9"
                  title="Entrada gerada por um corte. Edite pelo histórico de cortes."
                />
              ) : (
                <>
                  <TransactionDialog
                    transaction={{ id: tx.id }}
                    defaults={{
                      type: tx.type,
                      description: tx.description,
                      category: tx.category,
                      amountCents: tx.amountCents,
                      paymentMethod: tx.paymentMethod,
                      date: toDateInput(tx.date),
                      notes: tx.notes,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <form action={deleteTransactionAction}>
                    <input type="hidden" name="id" value={tx.id} />
                    <ConfirmButton
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      className="text-destructive hover:bg-destructive/10"
                      message={`Excluir "${tx.description}"?`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmButton>
                  </form>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
