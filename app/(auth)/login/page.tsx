import Link from 'next/link';
import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Entrar na Barbearia' };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <LoginForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
