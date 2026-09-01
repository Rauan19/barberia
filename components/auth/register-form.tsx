'use client';

import { useActionState } from 'react';
import { AlertCircle } from 'lucide-react';

import { registerAction } from '@/app/actions/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/action-state';

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, idleState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Sua conta já vem com os serviços mais comuns cadastrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Seu nome" htmlFor="name">
            <Input id="name" name="name" placeholder="Rauan" required />
          </FormField>

          <FormField label="Nome da barbearia" htmlFor="barbershop" hint="Opcional">
            <Input id="barbershop" name="barbershop" placeholder="Barbearia do Rauan" />
          </FormField>

          <FormField label="E-mail" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              required
            />
          </FormField>

          <FormField label="Senha" htmlFor="password" hint="Mínimo de 6 caracteres">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </FormField>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="w-full">Criar conta</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
