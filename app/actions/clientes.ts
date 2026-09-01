'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { dateInputToUtc } from '@/lib/date';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const clientSchema = z.object({
  name: z.string().min(2, 'Informe o nome do cliente'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
});

function readForm(formData: FormData) {
  return clientSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    birthDate: String(formData.get('birthDate') ?? '').trim() || undefined,
    notes: String(formData.get('notes') ?? '').trim() || undefined,
  });
}

export async function createClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = readForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.client.create({
    data: {
      userId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      birthDate: parsed.data.birthDate ? dateInputToUtc(parsed.data.birthDate) : null,
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard');
  return succeed('Cliente cadastrado!');
}

export async function updateClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const parsed = readForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const result = await prisma.client.updateMany({
    where: { id, userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      birthDate: parsed.data.birthDate ? dateInputToUtc(parsed.data.birthDate) : null,
      notes: parsed.data.notes ?? null,
    },
  });

  if (result.count === 0) return fail('Cliente não encontrado.');

  revalidatePath('/dashboard/clientes');
  revalidatePath(`/dashboard/clientes/${id}`);
  return succeed('Cliente atualizado!');
}

export async function deleteClientAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  await prisma.client.deleteMany({ where: { id, userId } });

  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard');
  redirect('/dashboard/clientes');
}
