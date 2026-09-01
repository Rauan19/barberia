'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { parseMoneyToCents } from '@/lib/utils';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const goalSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  revenueTarget: z.number().int().min(0),
  cutsTarget: z.number().int().min(0),
});

export async function saveGoalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse({
    year: Number(formData.get('year')),
    month: Number(formData.get('month')),
    revenueTarget: parseMoneyToCents(String(formData.get('revenueTarget') ?? '')),
    cutsTarget: Number(formData.get('cutsTarget') ?? 0) || 0,
  });

  if (!parsed.success) return fail('Preencha a meta corretamente.');

  const { year, month, ...targets } = parsed.data;

  await prisma.goal.upsert({
    where: { userId_year_month: { userId, year, month } },
    update: targets,
    create: { userId, year, month, ...targets },
  });

  revalidatePath('/dashboard/metas');
  revalidatePath('/dashboard');
  return succeed('Meta salva!');
}

export async function deleteGoalAction(formData: FormData) {
  const userId = await requireUserId();
  const year = Number(formData.get('year'));
  const month = Number(formData.get('month'));

  await prisma.goal.deleteMany({ where: { userId, year, month } });

  revalidatePath('/dashboard/metas');
  revalidatePath('/dashboard');
}
