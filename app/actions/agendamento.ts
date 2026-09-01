'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

import { prisma } from '@/lib/db';
import { availableSlots, isSlotFree } from '@/lib/availability';
import { normalizePhone } from '@/lib/slug';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const bookingSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1, 'Escolha um serviço'),
  startAt: z.string().min(1, 'Escolha um horário'),
  customerName: z.string().min(2, 'Informe seu nome'),
  customerPhone: z.string().min(10, 'Informe um telefone válido com DDD'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
});

export type BookingState = ActionState & { appointmentId?: string };

/**
 * Agendamento feito pelo cliente na pagina publica.
 * Entra como PENDENTE: o barbeiro confirma depois.
 */
export async function createBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    slug: String(formData.get('slug') ?? ''),
    serviceId: String(formData.get('serviceId') ?? ''),
    startAt: String(formData.get('startAt') ?? ''),
    customerName: String(formData.get('customerName') ?? '').trim(),
    customerPhone: String(formData.get('customerPhone') ?? '').trim(),
    paymentMethod: String(formData.get('paymentMethod') ?? 'PIX') as PaymentMethod,
    notes: String(formData.get('notes') ?? '').trim() || undefined,
  });

  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const barber = await prisma.user.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      slotMinutes: true,
      bookingOpen: true,
      workingHours: {
        select: {
          weekday: true,
          open: true,
          startMinute: true,
          endMinute: true,
          breakStart: true,
          breakEnd: true,
        },
      },
    },
  });

  if (!barber) return fail('Barbearia não encontrada.');
  if (!barber.bookingOpen) {
    return fail('Os agendamentos online estão desativados no momento.');
  }

  const service = await prisma.service.findFirst({
    where: { id: parsed.data.serviceId, userId: barber.id, active: true, bookable: true },
    select: { id: true, name: true, priceCents: true, durationMin: true },
  });
  if (!service) return fail('Serviço indisponível.');

  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) return fail('Horário inválido.');

  // Reconfere a disponibilidade: outra pessoa pode ter pegado o horario.
  const free = await isSlotFree({
    barber: { id: barber.id, slotMinutes: barber.slotMinutes, workingHours: barber.workingHours },
    startAt,
    durationMin: service.durationMin,
  });
  if (!free) return fail('Esse horário acabou de ser ocupado. Escolha outro, por favor.');

  const phone = normalizePhone(parsed.data.customerPhone);

  // Reaproveita o cadastro do cliente quando o telefone ja existe.
  const existingClient = await prisma.client.findFirst({
    where: { userId: barber.id, phone },
    select: { id: true },
  });

  const clientId =
    existingClient?.id ??
    (
      await prisma.client.create({
        data: { userId: barber.id, name: parsed.data.customerName, phone },
        select: { id: true },
      })
    ).id;

  const appointment = await prisma.appointment.create({
    data: {
      userId: barber.id,
      clientId,
      serviceId: service.id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMin: service.durationMin,
      customerName: parsed.data.customerName,
      customerPhone: phone,
      startAt,
      endAt: new Date(startAt.getTime() + service.durationMin * 60000),
      paymentMethod: parsed.data.paymentMethod,
      status: 'PENDING',
      source: 'PUBLIC',
      notes: parsed.data.notes ?? null,
    },
    select: { id: true },
  });

  revalidatePath(`/b/${parsed.data.slug}`);
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');

  return { ...succeed('Agendamento enviado!'), appointmentId: appointment.id };
}

/** Horarios livres de um dia, usado pela pagina publica ao trocar de data. */
export async function fetchSlotsAction(
  slug: string,
  serviceId: string,
  dayISO: string,
): Promise<{ label: string; startAt: string }[]> {
  const barber = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      slotMinutes: true,
      bookingOpen: true,
      workingHours: {
        select: {
          weekday: true,
          open: true,
          startMinute: true,
          endMinute: true,
          breakStart: true,
          breakEnd: true,
        },
      },
    },
  });
  if (!barber || !barber.bookingOpen) return [];

  const service = await prisma.service.findFirst({
    where: { id: serviceId, userId: barber.id, active: true, bookable: true },
    select: { durationMin: true },
  });
  if (!service) return [];

  const day = new Date(dayISO);
  if (Number.isNaN(day.getTime())) return [];

  const slots = await availableSlots({
    barber: { id: barber.id, slotMinutes: barber.slotMinutes, workingHours: barber.workingHours },
    day,
    durationMin: service.durationMin,
  });

  return slots.map((slot) => ({ label: slot.label, startAt: slot.startAt.toISOString() }));
}
