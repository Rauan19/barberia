'use client';

import * as React from 'react';

import { FormField, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/lib/labels';
import { toDateInput } from '@/lib/date';
import { formatAmount } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type TransactionDefaults = {
  id?: string;
  type?: 'INCOME' | 'EXPENSE';
  description?: string;
  category?: string;
  amountCents?: number;
  paymentMethod?: string;
  date?: string;
  notes?: string | null;
};

export function TransactionFields({ defaults }: { defaults?: TransactionDefaults }) {
  const [type, setType] = React.useState<'INCOME' | 'EXPENSE'>(
    defaults?.type ?? 'EXPENSE',
  );
  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [category, setCategory] = React.useState(
    defaults?.category ?? categories[0].value,
  );

  function handleTypeChange(next: 'INCOME' | 'EXPENSE') {
    setType(next);
    setCategory(
      (next === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].value,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Tipo">
        <div className="grid grid-cols-2 gap-2">
          {(['INCOME', 'EXPENSE'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleTypeChange(option)}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                type === option
                  ? option === 'INCOME'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-input bg-card text-muted-foreground hover:bg-accent',
              )}
            >
              {option === 'INCOME' ? '📥 Entrada' : '📤 Saída'}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </FormField>

      <FormField label="Descrição" htmlFor="description">
        <Input
          id="description"
          name="description"
          defaultValue={defaults?.description ?? ''}
          placeholder={
            type === 'INCOME' ? 'Ex.: Venda de pomada' : 'Ex.: Compra de produtos'
          }
          required
          autoFocus
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Categoria" htmlFor="category">
          <Select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Valor" htmlFor="amount">
          <MoneyInput
            id="amount"
            name="amount"
            defaultValue={
              defaults?.amountCents !== undefined
                ? formatAmount(defaults.amountCents)
                : ''
            }
            required
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Data" htmlFor="date">
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={defaults?.date ?? toDateInput(new Date())}
            required
          />
        </FormField>

        <FormField label="Forma de pagamento" htmlFor="paymentMethod">
          <Select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={defaults?.paymentMethod ?? 'PIX'}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Observação" htmlFor="notes" hint="Opcional">
        <Textarea id="notes" name="notes" rows={2} defaultValue={defaults?.notes ?? ''} />
      </FormField>
    </div>
  );
}
