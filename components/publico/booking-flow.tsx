'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

import { createBookingAction, fetchSlotsAction } from '@/app/actions/agendamento';
import { BookingSuccess } from '@/components/publico/booking-success';
import { StepProgress, STEP_LABELS } from '@/components/publico/step-progress';
import {
  DayStep,
  DetailsStep,
  ServiceStep,
  SlotStep,
  type BookingDay,
  type PublicService,
  type SlotOption,
} from '@/components/publico/booking-steps';
import { formatBRL } from '@/lib/utils';

export type { BookingDay, PublicService, SlotOption };

const idle = { ok: false } as const;

export function BookingFlow({
  slug,
  barbershop,
  services,
  days,
}: {
  slug: string;
  barbershop: string;
  services: PublicService[];
  days: BookingDay[];
}) {
  const [step, setStep] = React.useState(0);
  const [furthest, setFurthest] = React.useState(0);
  const [serviceId, setServiceId] = React.useState('');
  const [dayISO, setDayISO] = React.useState('');
  const [slots, setSlots] = React.useState<SlotOption[]>([]);
  const [startAt, setStartAt] = React.useState('');
  const [payment, setPayment] = React.useState('PIX');
  const [loading, startTransition] = useTransition();
  const [state, formAction] = useActionState(createBookingAction, idle);

  const service = services.find((item) => item.id === serviceId);
  const day = days.find((item) => item.iso === dayISO);
  const slot = slots.find((item) => item.startAt === startAt);

  function goTo(next: number) {
    setStep(next);
    setFurthest((prev) => Math.max(prev, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function chooseService(id: string) {
    setServiceId(id);
    setStartAt('');
    setSlots([]);
    if (dayISO) loadSlots(id, dayISO);
    goTo(1);
  }

  function chooseDay(iso: string) {
    setDayISO(iso);
    setStartAt('');
    loadSlots(serviceId, iso);
    goTo(2);
  }

  function loadSlots(nextService: string, nextDay: string) {
    startTransition(async () => {
      setSlots(await fetchSlotsAction(slug, nextService, nextDay));
    });
  }

  function chooseSlot(value: string) {
    setStartAt(value);
    goTo(3);
  }

  if (state.ok && service) {
    return (
      <BookingSuccess
        barbershop={barbershop}
        serviceName={service.name}
        priceCents={service.priceCents}
        startAt={startAt}
        payment={payment}
      />
    );
  }

  const canAdvance = [Boolean(serviceId), Boolean(dayISO), Boolean(startAt), true][step];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="startAt" value={startAt} />
      <input type="hidden" name="paymentMethod" value={payment} />

      <StepProgress current={step} furthest={furthest} onJump={goTo} />

      {step > 0 && service ? (
        <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-400">
          <span className="text-zinc-200">{service.name}</span>
          {day ? ` · ${day.day}/${day.monthLabel}` : ''}
          {slot ? ` · ${slot.label}` : ''}
          {` · ${formatBRL(service.priceCents)}`}
        </p>
      ) : null}

      <section>
        <h2 className="mb-1 text-xl font-semibold text-white">
          {['Qual serviço você quer?', 'Escolha o dia', 'Escolha o horário', 'Quase lá'][step]}
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          {
            [
              'O valor e a duração já aparecem em cada opção.',
              'Só aparecem os dias em que a barbearia atende.',
              `Horários livres para ${service?.durationMin ?? 30} minutos.`,
              'Falta só o seu contato para o barbeiro confirmar.',
            ][step]
          }
        </p>

        <div key={step} className="animate-fade-in">
          {step === 0 ? (
            <ServiceStep services={services} selected={serviceId} onSelect={chooseService} />
          ) : null}
          {step === 1 ? <DayStep days={days} selected={dayISO} onSelect={chooseDay} /> : null}
          {step === 2 ? (
            <SlotStep
              slots={slots}
              selected={startAt}
              loading={loading}
              onSelect={chooseSlot}
            />
          ) : null}
          {step === 3 ? (
            <DetailsStep payment={payment} onPaymentChange={setPayment} />
          ) : null}
        </div>
      </section>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-white/10 bg-zinc-950/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/15 px-5 text-sm font-semibold text-zinc-300 transition-colors active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        ) : null}

        {step < 3 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => goTo(step + 1)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 text-base font-semibold text-zinc-950 transition-all active:scale-[0.99] disabled:opacity-40"
          >
            {canAdvance ? 'Continuar' : `Escolha ${STEP_LABELS[step].toLowerCase()}`}
            {canAdvance ? <ArrowRight className="h-5 w-5" /> : null}
          </button>
        ) : (
          <ConfirmButton />
        )}
      </div>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 text-base font-semibold text-zinc-950 transition-all active:scale-[0.99] disabled:opacity-40"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
      Confirmar agendamento
    </button>
  );
}
