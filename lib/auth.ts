import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';

const COOKIE_NAME = 'bb_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET não configurado no .env');
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ['HS256'],
    });
    if (typeof payload.userId !== 'string') return null;
    return {
      userId: payload.userId,
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
    };
  } catch {
    return null;
  }
}

/** Sessao obrigatoria: redireciona para o login quando nao ha usuario. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

/**
 * Id do usuario logado. Toda consulta ao banco deve ser filtrada por ele -
 * e o que garante o isolamento entre barbeiros.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await requireSession();
  return userId;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      barbershop: true,
      slug: true,
      phone: true,
      address: true,
      bio: true,
      logoMime: true,
      createdAt: true,
    },
  });

  if (!user) return null;
  return { ...user, hasLogo: Boolean(user.logoMime) };
}

export { COOKIE_NAME };
