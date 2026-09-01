'use client';

import { CalendarX, Clock, Loader2 } from 'lucide-react';

import { PaymentChoice } from '@/components/publico/payment-choice';
import { WEEKDAY_SHORT_LABELS } from '@/lib/schedule';
import { formatBRL, cn } from '@/lib/utils';

export type PublicService = {
  id: string;
  name: string;
  priceCents: number;
  durationMin: number;
};

export type BookingDay = {
  iso: string;
  day: number;
  weekday: number;
  monthLabel: string;
  full: boolean;
};

export type SlotOption = { label: string; startAt: string };

export function ServiceStep({
  services,
  selected,
  onSelect,
}: {
  services: PublicService[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {services.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all active:scale-[0.99]',
            item.id === selected
              ? 'border-amber-400 bg-amber-400/10'
              : 'border-white/10 bg-white/5 hover:border-white/20',
          )}
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-white">{item.name}</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
              <Clock className="h-3 w-3" />
              {item.durationMin} min
            </span>
          </span>
          <span
            className={cn(
              'shrink-0 text-base font-semibold tabular',
              item.id === selected ? 'text-amber-300' : 'text-zinc-300',
            )}
          >
            {formatBRL(item.priceCents)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function DayStep({
  days,
  selected,
  onSelect,
}: {
  days: BookingDay[];
  selected: string;
  onSelect: (iso: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {days.map((item) => {
        const active = item.iso === selected;
        return (
          <button
            key={item.iso}
            type="button"
            disabled={item.full}
            onClick={() => onSelect(item.iso)}
            className={cn(
              'flex min-h-[72px] flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all active:scale-95',
              item.full && 'cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-700',
              !item.full && active && 'border-amber-400 bg-amber-400/10 text-amber-300',
              !item.full &&
                !active &&
                'border-white/10 bg-white/5 text-zinc-300 hover:border-white/25',
            )}
          >
            <span className="text-[10px] font-medium uppercase">
              {WEEKDAY_SHORT_LABELS[item.weekday]}
            </span>
            <span className="text-xl font-semibold leading-none">{item.day}</span>
            <span className="text-[10px] uppercase opacity-70">{item.monthLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SlotStep({
  slots,
  selected,
  loading,
  onSelect,
}: {
  slots: SlotOption[];
  selected: string;
  loading: boolean;
  onSelect: (startAt: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Buscando horários...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 py-12 text-center">
        <CalendarX className="h-6 w-6 text-zinc-500" />
        <p className="text-sm text-zinc-400">Nenhum horário livre nesse dia.</p>
        <p className="text-xs text-zinc-500">Volte e escolha outra data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot.startAt}
          type="button"
          onClick={() => onSelect(slot.startAt)}
          className={cn(
            'min-h-[50px] rounded-xl border-2 text-sm font-semibold tabular transition-all active:scale-95',
            slot.startAt === selected
              ? 'border-amber-400 bg-amber-400 text-zinc-950'
              : 'border-white/10 bg-white/5 text-zinc-200 hover:border-white/25',
          )}
        >
          {slot.label}
        </button>
      ))}
    </div>
  );
}

const inputClass =
  'h-13 w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none';

export function DetailsStep({
  payment,
  onPaymentChange,
}: {
  payment: string;
  onPaymentChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="customerName" className="text-sm font-medium text-zinc-300">
          Seu nome
        </label>
        <input
          id="customerName"
          name="customerName"
          placeholder="Como o barbeiro te chama"
          required
          autoComplete="name"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="customerPhone" className="text-sm font-medium text-zinc-300">
          WhatsApp
        </label>
        <input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          inputMode="tel"
          placeholder="(75) 99999-9999"
          required
          autoComplete="tel"
          className={inputClass}
        />
        <p className="text-xs text-zinc-500">É por aqui que a confirmação chega.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">Como você vai pagar</span>
        <PaymentChoice
          name="paymentMethodChoice"
          tone="dark"
          value={payment}
          onChange={onPaymentChange}
        />
        <p className="text-xs text-zinc-500">O pagamento é feito na barbearia.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium text-zinc-300">
          Observação <span className="font-normal text-zinc-500">(opcional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Ex.: máquina 2 nas laterais"
          className={inputClass}
        />
      </div>
    </div>
  );
}
