'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { parseMoneyToCents } from '@/lib/utils';
import { dateInputToUtc } from '@/lib/date';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const cutSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().min(1, 'Informe o serviço'),
  priceCents: z.number().int().min(0, 'Valor inválido'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  performedAt: z.date(),
  notes: z.string().optional(),
});

async function parseCutForm(userId: string, formData: FormData) {
  const serviceId = String(formData.get('serviceId') ?? '').trim() || undefined;

  let serviceName = String(formData.get('serviceName') ?? '').trim();
  if (serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId },
      select: { name: true },
    });
    if (!service) return { error: 'Serviço não encontrado.' as const };
    serviceName = service.name;
  }

  const dateValue = String(formData.get('performedAt') ?? '').trim();
  const performedAt = dateValue ? dateInputToUtc(dateValue) : new Date();
  if (!performedAt) return { error: 'Data inválida.' as const };

  const parsed = cutSchema.safeParse({
    clientId: String(formData.get('clientId') ?? '').trim() || undefined,
    clientName: String(formData.get('clientName') ?? '').trim() || undefined,
    serviceId,
    serviceName,
    priceCents: parseMoneyToCents(String(formData.get('price') ?? '')),
    paymentMethod: String(formData.get('paymentMethod') ?? 'PIX') as PaymentMethod,
    performedAt,
    notes: String(formData.get('notes') ?? '').trim() || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return { data: parsed.data };
}

/** Garante o cliente: usa o selecionado ou cria um novo pelo nome digitado. */
async function resolveClientId(
  userId: string,
  clientId?: string,
  clientName?: string,
) {
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
      select: { id: true },
    });
    return client?.id ?? null;
  }
  if (clientName) {
    const created = await prisma.client.create({
      data: { userId, name: clientName },
      select: { id: true },
    });
    return created.id;
  }
  return null;
}

export async function createCutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = await parseCutForm(userId, formData);
  if (parsed.error) return fail(parsed.error);

  const data = parsed.data!;
  const clientId = await resolveClientId(userId, data.clientId, data.clientName);

  // O corte e a entrada financeira nascem juntos: se um falhar, nenhum e gravado.
  await prisma.$transaction(async (tx) => {
    const cut = await tx.cut.create({
      data: {
        userId,
        clientId,
        serviceId: data.serviceId ?? null,
        serviceName: data.serviceName,
        priceCents: data.priceCents,
        paymentMethod: data.paymentMethod,
        performedAt: data.performedAt,
        notes: data.notes ?? null,
      },
      include: { client: { select: { name: true } } },
    });

    await tx.financialTransaction.create({
      data: {
        userId,
        type: 'INCOME',
        category: 'CORTE',
        description: cut.client
          ? `${cut.serviceName} de ${cut.client.name}`
          : cut.serviceName,
        amountCents: cut.priceCents,
        paymentMethod: cut.paymentMethod,
        date: cut.performedAt,
        cutId: cut.id,
      },
    });
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/cortes');
  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard/financeiro');
  revalidatePath('/dashboard/relatorios');
  return succeed('Corte registrado!');
}

export async function updateCutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const parsed = await parseCutForm(userId, formData);
  if (parsed.error) return fail(parsed.error);

  const data = parsed.data!;
  const existing = await prisma.cut.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return fail('Corte não encontrado.');

  const clientId = await resolveClientId(userId, data.clientId, data.clientName);

  await prisma.$transaction(async (tx) => {
    const cut = await tx.cut.update({
      where: { id },
      data: {
        clientId,
        serviceId: data.serviceId ?? null,
        serviceName: data.serviceName,
        priceCents: data.priceCents,
        paymentMethod: data.paymentMethod,
        performedAt: data.performedAt,
        notes: data.notes ?? null,
      },
      include: { client: { select: { name: true } } },
    });

    const description = cut.client
      ? `${cut.serviceName} de ${cut.client.name}`
      : cut.serviceName;

    await tx.financialTransaction.upsert({
      where: { cutId: id },
      update: {
        description,
        amountCents: cut.priceCents,
        paymentMethod: cut.paymentMethod,
        date: cut.performedAt,
      },
      create: {
        userId,
        type: 'INCOME',
        category: 'CORTE',
        description,
        amountCents: cut.priceCents,
        paymentMethod: cut.paymentMethod,
        date: cut.performedAt,
        cutId: id,
      },
    });
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/cortes');
  revalidatePath('/dashboard/financeiro');
  return succeed('Corte atualizado!');
}

export async function deleteCutAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const backTo = String(formData.get('backTo') ?? '');

  // A entrada financeira do corte cai junto (onDelete: Cascade no cutId).
  await prisma.cut.deleteMany({ where: { id, userId } });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/cortes');
  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard/financeiro');

  if (backTo) redirect(backTo);
}
