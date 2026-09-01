'use client';

import { Banknote, CreditCard, QrCode, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export const PAYMENT_CHOICES: {
  value: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'PIX', label: 'Pix', icon: QrCode },
  { value: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
  { value: 'CARTAO', label: 'Cartão', icon: CreditCard },
  { value: 'OUTRO', label: 'Outro', icon: Wallet },
];

/**
 * Escolha de forma de pagamento com icone.
 * `tone="dark"` e usado na pagina publica, que tem fundo escuro.
 */
export function PaymentChoice({
  name = 'paymentMethod',
  value,
  onChange,
  tone = 'light',
  options = PAYMENT_CHOICES,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  tone?: 'light' | 'dark';
  options?: typeof PAYMENT_CHOICES;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Forma de pagamento"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-sm font-medium transition-all active:scale-[0.98]',
              tone === 'dark'
                ? selected
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                : selected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            <Icon className="h-5 w-5" />
            {option.label}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
