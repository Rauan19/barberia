'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from '@/lib/auth';
import { fail, type ActionState } from '@/lib/action-state';
import { slugify } from '@/lib/slug';
import { EMPTY_WORKING_HOURS } from '@/lib/schedule';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
  barbershop: z.string().optional(),
});

/** Servicos iniciais criados junto com a conta. */
const DEFAULT_SERVICES = [
  { name: 'Corte', priceCents: 3000, durationMin: 30 },
  { name: 'Barba', priceCents: 2000, durationMin: 20 },
  { name: 'Corte + Barba', priceCents: 4500, durationMin: 50 },
  { name: 'Sobrancelha', priceCents: 1000, durationMin: 15 },
];

/** Garante um slug unico para a pagina publica. */
async function uniqueSlug(base: string) {
  const root = slugify(base);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const taken = await prisma.user.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail('E-mail ou senha incorretos.');
  }

  await createSession({ userId: user.id, name: user.name, email: user.email });
  redirect('/dashboard');
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
    barbershop: String(formData.get('barbershop') ?? '').trim() || undefined,
  });

  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) return fail('Já existe uma conta com esse e-mail.');

  const slug = await uniqueSlug(parsed.data.barbershop ?? parsed.data.name);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      barbershop: parsed.data.barbershop,
      slug,
      passwordHash: await hashPassword(parsed.data.password),
      services: { create: DEFAULT_SERVICES },
      workingHours: { create: EMPTY_WORKING_HOURS },
    },
  });

  await createSession({ userId: user.id, name: user.name, email: user.email });
  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
