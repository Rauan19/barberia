'use client';

import { useActionState } from 'react';
import { AlertCircle } from 'lucide-react';

import { loginAction } from '@/app/actions/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { idleState } from '@/lib/action-state';

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idleState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse o painel da sua barbearia.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
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

          <FormField label="Senha" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </FormField>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="w-full">Entrar</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
