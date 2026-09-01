'use client';

import * as React from 'react';

import { Input } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/** Campo de dinheiro que mostra "30,00" e envia o texto ja normalizado. */
export function MoneyInput({
  name,
  defaultValue,
  value,
  onValueChange,
  className,
  id,
  required,
  autoFocus,
}: {
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  function handleChange(next: string) {
    const cleaned = next.replace(/[^\d,.]/g, '');
    if (!controlled) setInternal(cleaned);
    onValueChange?.(cleaned);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        name={name}
        inputMode="decimal"
        placeholder="0,00"
        required={required}
        autoFocus={autoFocus}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className={cn('pl-9 tabular', className)}
      />
    </div>
  );
}
