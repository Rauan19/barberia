'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import {
  createSession,
  hashPassword,
  requireSession,
  verifyPassword,
} from '@/lib/auth';
import { fail, succeed, type ActionState } from '@/lib/action-state';

const profileSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  barbershop: z.string().optional(),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    barbershop: String(formData.get('barbershop') ?? '').trim() || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: parsed.data.name, barbershop: parsed.data.barbershop ?? null },
  });

  // O nome fica no cookie de sessao, entao ele precisa ser reemitido.
  await createSession({ userId: user.id, name: user.name, email: user.email });

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard');
  return succeed('Dados atualizados!');
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  const confirm = String(formData.get('confirmPassword') ?? '');

  if (next.length < 6) return fail('A nova senha precisa ter ao menos 6 caracteres.');
  if (next !== confirm) return fail('A confirmação não confere com a nova senha.');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return fail('Senha atual incorreta.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  return succeed('Senha alterada!');
}

/**
 * Teto de seguranca, nao um limite que o barbeiro deva sentir.
 * O navegador reduz a imagem para uns 100 KB antes de enviar (lib/image.ts);
 * isso aqui so existe para barrar um envio fora do fluxo normal.
 */
const MAX_LOGO_BYTES = 6 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
];

/** Guarda a logo da barbearia no proprio banco. */
export async function uploadLogoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const file = formData.get('logo');

  if (!(file instanceof File) || file.size === 0) {
    return fail('Escolha uma imagem.');
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return fail('Esse tipo de arquivo não é uma imagem. Use PNG, JPG, WEBP ou SVG.');
  }
  if (file.size > MAX_LOGO_BYTES) {
    return fail('Essa imagem é grande demais. Tente escolher outra.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  await prisma.user.update({
    where: { id: session.userId },
    data: { logoData: bytes, logoMime: file.type },
  });

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard');
  return succeed('Logo atualizada!');
}

export async function removeLogoAction() {
  const session = await requireSession();

  await prisma.user.update({
    where: { id: session.userId },
    data: { logoData: null, logoMime: null },
  });

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard');
}

const publicPageSchema = z.object({
  slug: z
    .string()
    .min(3, 'O endereço precisa ter ao menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

/** Dados que aparecem na pagina publica de agendamento. */
export async function updatePublicPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = publicPageSchema.safeParse({
    slug: String(formData.get('slug') ?? '').trim().toLowerCase(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    address: String(formData.get('address') ?? '').trim() || undefined,
    bio: String(formData.get('bio') ?? '').trim() || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const taken = await prisma.user.findFirst({
    where: { slug: parsed.data.slug, id: { not: session.userId } },
    select: { id: true },
  });
  if (taken) return fail('Esse endereço já está em uso. Escolha outro.');

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      slug: parsed.data.slug,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      bio: parsed.data.bio ?? null,
    },
  });

  revalidatePath('/dashboard/configuracoes');
  return succeed('Página pública atualizada!');
}
