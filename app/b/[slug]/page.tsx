import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { MapPin, Phone, Scissors, CalendarOff } from 'lucide-react';

import { prisma } from '@/lib/db';
import { barberBySlug } from '@/lib/availability';
import { nextDays, WEEKDAY_LABELS, minutesToLabel } from '@/lib/schedule';
import { zonedParts, startOfDayBR, endOfDayBR, MONTH_NAMES } from '@/lib/date';
import { initials, formatPhone } from '@/lib/utils';
import { BookingFlow } from '@/components/publico/booking-flow';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const barber = await prisma.user.findUnique({
    where: { slug },
    select: { name: true, barbershop: true },
  });
  const title = barber?.barbershop || barber?.name || 'Barbearia';
  return {
    title: `Agendar horário na ${title}`,
    description: `Agende seu horário na ${title} em poucos toques.`,
  };
}

export default async function PaginaPublica({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const barber = await barberBySlug(slug);
  if (!barber) notFound();

  const services = await prisma.service.findMany({
    where: { userId: barber.id, active: true, bookable: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, priceCents: true, durationMin: true },
  });

  const window = nextDays(barber.bookingDays);
  const openWeekdays = new Set(
    barber.workingHours.filter((hour) => hour.open).map((hour) => hour.weekday),
  );

  // Folgas de dia inteiro somem da lista junto com os dias em que ele nao atende.
  const fullDayBlocks = await prisma.timeBlock.findMany({
    where: {
      userId: barber.id,
      allDay: true,
      endAt: { gte: startOfDayBR(window[0]) },
      startAt: { lte: endOfDayBR(window[window.length - 1]) },
    },
    select: { startAt: true },
  });
  const blockedDays = new Set(
    fullDayBlocks.map((block) => startOfDayBR(block.startAt).getTime()),
  );

  const days = window
    .filter(
      (date) =>
        openWeekdays.has(zonedParts(date).weekday) &&
        !blockedDays.has(startOfDayBR(date).getTime()),
    )
    .map((date) => {
      const parts = zonedParts(date);
      return {
        iso: date.toISOString(),
        day: parts.day,
        weekday: parts.weekday,
        monthLabel: MONTH_NAMES[parts.month - 1].slice(0, 3),
        full: false,
      };
    });

  const title = barber.barbershop || barber.name;
  const openDays = barber.workingHours.filter((hour) => hour.open);

  return (
    <div className="relative min-h-[100dvh] bg-zinc-950 text-zinc-100">
      {/* Garante fundo escuro tambem no overscroll do celular. */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-zinc-950" />
      <div className="mx-auto w-full max-w-lg px-5 pb-10 pt-10">
        <header className="flex flex-col items-center gap-4 text-center">
          {barber.logoMime ? (
            <Image
              src={`/b/${barber.slug}/logo`}
              alt={title}
              width={88}
              height={88}
              unoptimized
              className="h-22 w-22 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-400 text-2xl font-bold text-zinc-950">
              {initials(title)}
            </span>
          )}

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-zinc-400">
              <Scissors className="h-3.5 w-3.5 text-amber-400" />
              com {barber.name}
            </p>
          </div>

          {barber.bio ? (
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">{barber.bio}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-400">
            {barber.address ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                {barber.address}
              </span>
            ) : null}
            {barber.phone ? (
              <a
                href={`https://wa.me/55${barber.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-amber-400"
              >
                <Phone className="h-3.5 w-3.5 text-amber-400" />
                {formatPhone(barber.phone)}
              </a>
            ) : null}
          </div>
        </header>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {!barber.bookingOpen || services.length === 0 || days.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <CalendarOff className="h-7 w-7 text-zinc-500" />
            <p className="font-medium text-white">Agendamento indisponível</p>
            <p className="max-w-xs text-sm text-zinc-400">
              {barber.phone
                ? 'Entre em contato pelo WhatsApp para marcar seu horário.'
                : 'A barbearia não está aceitando agendamentos online no momento.'}
            </p>
            {barber.phone ? (
              <a
                href={`https://wa.me/55${barber.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex h-11 items-center rounded-xl bg-amber-400 px-5 text-sm font-semibold text-zinc-950"
              >
                Chamar no WhatsApp
              </a>
            ) : null}
          </div>
        ) : (
          <BookingFlow
            slug={barber.slug}
            barbershop={title}
            services={services}
            days={days}
          />
        )}

        {openDays.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Horário de funcionamento
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-white/10">
              {barber.workingHours.map((hour) => (
                <li
                  key={hour.weekday}
                  className="flex items-center justify-between gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm last:border-b-0"
                >
                  <span className="text-zinc-300">{WEEKDAY_LABELS[hour.weekday]}</span>
                  <span className={hour.open ? 'tabular text-zinc-400' : 'text-zinc-600'}>
                    {hour.open
                      ? `${minutesToLabel(hour.startMinute)} às ${minutesToLabel(hour.endMinute)}`
                      : 'Fechado'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="mt-10 text-center text-xs text-zinc-600">
          Agendamento online · {title}
        </footer>
      </div>
    </div>
  );
}
