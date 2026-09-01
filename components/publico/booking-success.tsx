'use client';

import { CalendarCheck, Clock3, MessageCircle } from 'lucide-react';

import { PAYMENT_CHOICES } from '@/components/publico/payment-choice';
import { formatBRL } from '@/lib/utils';
import { formatDateBR } from '@/lib/date';
import { minutesToLabel, minutesOfDayBR } from '@/lib/schedule';

export function BookingSuccess({
  barbershop,
  serviceName,
  priceCents,
  startAt,
  payment,
}: {
  barbershop: string;
  serviceName: string;
  priceCents: number;
  startAt: string;
  payment: string;
}) {
  const date = new Date(startAt);
  const paymentLabel =
    PAYMENT_CHOICES.find((choice) => choice.value === payment)?.label ?? payment;
  const timeLabel = minutesToLabel(minutesOfDayBR(date));

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center animate-fade-in">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/15">
        <CalendarCheck className="h-9 w-9 text-amber-400" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-white">Agendamento enviado!</h2>
        <p className="mt-2 max-w-xs text-sm text-zinc-400">
          {barbershop} vai confirmar seu horário. Você recebe a confirmação pelo WhatsApp.
        </p>
      </div>

      <dl className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
        <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-3">
          <dt className="text-sm text-zinc-400">Serviço</dt>
          <dd className="font-medium text-white">{serviceName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-3">
          <dt className="text-sm text-zinc-400">Quando</dt>
          <dd className="flex items-center gap-1.5 font-medium text-white">
            <Clock3 className="h-3.5 w-3.5 text-amber-400" />
            {formatDateBR(date)} às {timeLabel}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-3">
          <dt className="text-sm text-zinc-400">Pagamento</dt>
          <dd className="font-medium text-white">{paymentLabel}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-3">
          <dt className="text-sm text-zinc-400">Valor</dt>
          <dd className="text-lg font-semibold text-amber-300 tabular">
            {formatBRL(priceCents)}
          </dd>
        </div>
      </dl>

      <p className="flex items-center gap-2 text-xs text-zinc-500">
        <MessageCircle className="h-3.5 w-3.5" />
        Status: aguardando confirmação da barbearia
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-sm font-medium text-amber-400 underline-offset-4 hover:underline"
      >
        Fazer outro agendamento
      </button>
    </div>
  );
}
