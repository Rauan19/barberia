'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { parseMoneyToCents } from '@/lib/utils';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const serviceSchema = z.object({
  name: z.string().min(2, 'Informe o nome do serviço'),
  priceCents: z.number().int().min(0, 'Valor inválido'),
  durationMin: z.number().int().min(5, 'A duração mínima é de 5 minutos'),
  bookable: z.boolean(),
});

function readForm(formData: FormData) {
  return serviceSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    priceCents: parseMoneyToCents(String(formData.get('price') ?? '')),
    durationMin: Number(formData.get('durationMin') ?? 30) || 30,
    bookable: formData.get('bookable') === 'on',
  });
}

export async function createServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = readForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.service.create({ data: { userId, ...parsed.data } });

  revalidatePath('/dashboard/servicos');
  revalidatePath('/dashboard/cortes');
  revalidatePath('/dashboard/agenda');
  return succeed('Serviço criado!');
}

export async function updateServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const parsed = readForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const result = await prisma.service.updateMany({
    where: { id, userId },
    data: parsed.data,
  });
  if (result.count === 0) return fail('Serviço não encontrado.');

  revalidatePath('/dashboard/servicos');
  revalidatePath('/dashboard/cortes');
  return succeed('Serviço atualizado!');
}

export async function toggleServiceAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const active = String(formData.get('active') ?? '') === 'true';

  await prisma.service.updateMany({ where: { id, userId }, data: { active } });
  revalidatePath('/dashboard/servicos');
  revalidatePath('/dashboard/cortes');
}

export async function deleteServiceAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  // Cortes ja registrados mantem o nome/preco gravados, entao apagar o
  // servico nao apaga o historico.
  await prisma.service.deleteMany({ where: { id, userId } });

  revalidatePath('/dashboard/servicos');
  revalidatePath('/dashboard/cortes');
}
