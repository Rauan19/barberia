import Link from 'next/link';
import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Criar conta na Barbearia' };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
