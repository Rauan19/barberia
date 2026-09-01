'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PaymentMethod, TransactionCategory, TransactionType } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { parseMoneyToCents } from '@/lib/utils';
import { dateInputToUtc } from '@/lib/date';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  description: z.string().min(2, 'Informe a descrição'),
  category: z.nativeEnum(TransactionCategory),
  amountCents: z.number().int().positive('Informe um valor maior que zero'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  date: z.date(),
  notes: z.string().optional(),
});

function readForm(formData: FormData) {
  const dateValue = String(formData.get('date') ?? '').trim();
  const date = dateValue ? dateInputToUtc(dateValue) : new Date();

  return transactionSchema.safeParse({
    type: String(formData.get('type') ?? 'EXPENSE') as TransactionType,
    description: String(formData.get('description') ?? '').trim(),
    category: String(formData.get('category') ?? 'OUTRAS_SAIDAS') as TransactionCategory,
    amountCents: parseMoneyToCents(String(formData.get('amount') ?? '')),
    paymentMethod: String(formData.get('paymentMethod') ?? 'PIX') as PaymentMethod,
    date: date ?? new Date(),
    notes: String(formData.get('notes') ?? '').trim() || undefined,
  });
}

function revalidateFinance() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/financeiro');
  revalidatePath('/dashboard/relatorios');
}

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = readForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.financialTransaction.create({
    data: { userId, ...parsed.data, notes: parsed.data.notes ?? null },
  });

  revalidateFinance();
  return succeed(
    parsed.data.type === 'INCOME' ? 'Entrada registrada!' : 'Saída registrada!',
  );
}

export async function updateTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');
  const parsed = readForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const existing = await prisma.financialTransaction.findFirst({
    where: { id, userId },
    select: { cutId: true },
  });
  if (!existing) return fail('Movimentação não encontrada.');
  if (existing.cutId) {
    return fail('Essa entrada veio de um corte. Edite o corte para alterá-la.');
  }

  await prisma.financialTransaction.update({
    where: { id },
    data: { ...parsed.data, notes: parsed.data.notes ?? null },
  });

  revalidateFinance();
  return succeed('Movimentação atualizada!');
}

export async function deleteTransactionAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get('id') ?? '');

  // Entradas geradas por cortes so somem quando o corte e apagado.
  await prisma.financialTransaction.deleteMany({
    where: { id, userId, cutId: null },
  });

  revalidateFinance();
}
