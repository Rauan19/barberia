'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AppointmentStatus, PaymentMethod } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { BLOCKING_STATUSES } from '@/lib/availability';
import { zonedTimeToUtc } from '@/lib/date';
import { labelToMinutes } from '@/lib/schedule';
import { normalizePhone } from '@/lib/slug';
import { parseMoneyToCents } from '@/lib/utils';
import { fail, succeed, type ActionState } from '@/lib/action-state';

function revalidateAgenda() {
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
}

/** Combina "2026-09-03" + "14:30" no instante correto (fuso do Brasil). */
function combineDateAndTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const minutes = labelToMinutes(timeValue);
  if (!year || !month || !day || minutes === null) return null;
  return zonedTimeToUtc(year, month, day, Math.floor(minutes / 60), minutes % 60);
}

const manualSchema = z.object({
  customerName: z.string().min(2, 'Informe o nome do cliente'),
  customerPhone: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().min(1, 'Informe o serviço'),
  priceCents: z.number().int().min(0),
  durationMin: z.number().int().min(5, 'Duração inválida'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
});

/** Le e valida os campos do formulario de agendamento. */
async function parseAppointmentForm(userId: string, formData: FormData) {
  const serviceId = String(formData.get('serviceId') ?? '').trim() || undefined;
  let serviceName = String(formData.get('serviceName') ?? '').trim();
  let priceCents = parseMoneyToCents(String(formData.get('price') ?? ''));
  let durationMin = Number(formData.get('durationMin') ?? 0);

  if (serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId },
      select: { name: true, priceCents: true, durationMin: true },
    });
    if (!service) return { error: 'Serviço não encontrado.' as const };
    serviceName = service.name;
    // O valor digitado manda: e assim que o barbeiro cobra mais ou menos que a tabela.
    if (!priceCents) priceCents = service.priceCents;
    if (!durationMin) durationMin = service.durationMin;
  }

  const parsed = manualSchema.safeParse({
    customerName: String(formData.get('customerName') ?? '').trim(),
    customerPhone: String(formData.get('customerPhone') ?? '').trim() || undefined,
    serviceId,
    serviceName,
    priceCents,
    durationMin: durationMin || 30,
    paymentMethod: String(formData.get('paymentMethod') ?? 'PIX') as PaymentMethod,
    notes: String(formData.get('notes') ?? '').trim() || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const startAt = combineDateAndTime(
    String(formData.get('date') ?? ''),
    String(formData.get('time') ?? ''),
  );
  if (!startAt) return { error: 'Data ou horário inválido.' as const };

  return { data: { ...parsed.data, startAt } };
}

/** Procura outro agendamento que ocupe a mesma faixa de horario. */
async function findConflict(
  userId: string,
  startAt: Date,
  durationMin: number,
  ignoreId?: string,
) {
  return prisma.appointment.findFirst({
    where: {
      userId,
      status: { in: [...BLOCKING_STATUSES] },
      startAt: { lt: new Date(startAt.getTime() + durationMin * 60000) },
      endAt: { gt: startAt },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true, customerName: true },
  });
}

/** Reaproveita o cadastro do cliente pelo telefone, ou cria um novo. */
async function resolveClient(userId: string, name: string, rawPhone?: string) {
  if (!rawPhone) return { clientId: null, phone: '' };

  const phone = normalizePhone(rawPhone);
  const existing = await prisma.client.findFirst({
    where: { userId, phone },
    select: { id: true },
  });
  if (existing) return { clientId: existing.id, phone };

  const created = await prisma.client.create({
    data: { userId, name, phone },
    select: { id: true },
  });
  return { clientId: created.id, phone };
}

/** Agendamento criado pelo proprio barbeiro: ja nasce confirmado. */
export async function createAppointmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = await parseAppointmentForm(userId, formData);
  if (parsed.error) return fail(parsed.error);

  const data = parsed.data!;
  const conflict = await findConflict(userId, data.startAt, data.durationMin);
  if (conflict) return fail(`Conflito com o agendamento de ${conflict.customerName}.`);

  const { clientId, phone } = await resolveClient(
    userId,
    data.customerName,
    data.customerPhone,
  );

  await prisma.appointment.create({
    data: {
      userId,
      clientId,
      serviceId: data.serviceId ?? null,
      serviceName: data.serviceName,
      priceCents: data.priceCents,
      durationMin: data.durationMin,
      customerName: data.customerName,
      customerPhone: phone,
      startAt: data.startAt,
      endAt: new Date(data.startAt.getTime() + data.durationMin * 60000),
      paymentMethod: data.paymentMethod,
      status: 'CONFIRMED',
      source: 'MANUAL',
      notes: data.notes ?? null,
    },
  });

  revalidateAgenda();
  return succeed('Agendamento criado!');
}

/**
 * Edita um agendamento que ainda nao foi concluido.
 * E aqui que da para reajustar o valor antes do atendimento acontecer.
 */
export async function updateAppointmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  const existing = await prisma.appointment.findFirst({
    where: { id, userId },
    select: { id: true, cutId: true },
  });
  if (!existing) return fail('Agendamento não encontrado.');
  if (existing.cutId) {
    return fail('Esse atendimento já foi concluído. Edite o corte pelo histórico.');
  }

  const parsed = await parseAppointmentForm(userId, formData);
  if (parsed.error) return fail(parsed.error);

  const data = parsed.data!;
  const conflict = await findConflict(userId, data.startAt, data.durationMin, id);
  if (conflict) return fail(`Conflito com o agendamento de ${conflict.customerName}.`);

  const { clientId, phone } = await resolveClient(
    userId,
    data.customerName,
    data.customerPhone,
  );

  await prisma.appointment.update({
    where: { id },
    data: {
      clientId,
      serviceId: data.serviceId ?? null,
      serviceName: data.serviceName,
      priceCents: data.priceCents,
      durationMin: data.durationMin,
      customerName: data.customerName,
      customerPhone: phone,
      startAt: data.startAt,
      endAt: new Date(data.startAt.getTime() + data.durationMin * 60000),
      paymentMethod: data.paymentMethod,
      notes: data.notes ?? null,
    },
  });

  revalidateAgenda();
  return succeed('Agendamento atualizado!');
}

/** Confirmar, recusar ou marcar falta. */
export async function setAppointmentStatusAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as AppointmentStatus;

  if (!Object.values(AppointmentStatus).includes(status)) return;
  if (status === 'DONE') return; // concluir tem fluxo proprio

  const appointment = await prisma.appointment.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!appointment) return;

  await prisma.appointment.update({ where: { id }, data: { status } });
  revalidateAgenda();
}

const completeSchema = z.object({
  priceCents: z.number().int().min(0, 'Valor inválido'),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

/**
 * Conclui o atendimento: vira um corte e uma entrada no financeiro.
 * O valor e a forma de pagamento podem mudar na hora de fechar a conta.
 */
export async function completeAppointmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  const appointment = await prisma.appointment.findFirst({
    where: { id, userId },
    select: {
      id: true,
      clientId: true,
      serviceId: true,
      serviceName: true,
      priceCents: true,
      customerName: true,
      startAt: true,
      notes: true,
      cutId: true,
      paymentMethod: true,
    },
  });
  if (!appointment) return fail('Agendamento não encontrado.');
  if (appointment.cutId) return fail('Esse atendimento já foi concluído.');

  const rawPrice = String(formData.get('price') ?? '').trim();
  const parsed = completeSchema.safeParse({
    priceCents: rawPrice ? parseMoneyToCents(rawPrice) : appointment.priceCents,
    paymentMethod: (String(formData.get('paymentMethod') ?? '') ||
      appointment.paymentMethod) as PaymentMethod,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.$transaction(async (tx) => {
    const cut = await tx.cut.create({
      data: {
        userId,
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        priceCents: parsed.data.priceCents,
        paymentMethod: parsed.data.paymentMethod,
        performedAt: appointment.startAt,
        notes: appointment.notes,
      },
    });

    await tx.financialTransaction.create({
      data: {
        userId,
        type: 'INCOME',
        category: 'CORTE',
        description: `${appointment.serviceName} de ${appointment.customerName}`,
        amountCents: parsed.data.priceCents,
        paymentMethod: parsed.data.paymentMethod,
        date: appointment.startAt,
        cutId: cut.id,
      },
    });

    await tx.appointment.update({
      where: { id },
      data: {
        status: 'DONE',
        cutId: cut.id,
        priceCents: parsed.data.priceCents,
        paymentMethod: parsed.data.paymentMethod,
      },
    });
  });

  revalidateAgenda();
  revalidatePath('/dashboard/cortes');
  revalidatePath('/dashboard/financeiro');
  return succeed('Atendimento concluído!');
}

export async function deleteAppointmentAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  await prisma.appointment.deleteMany({ where: { id, userId } });
  revalidateAgenda();
}
