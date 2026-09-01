'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { AlertCircle } from 'lucide-react';

import { changePasswordAction } from '@/app/actions/perfil';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, idleState);
  const toast = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Senha alterada!' });
    formRef.current?.reset();
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Senha atual" htmlFor="currentPassword">
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nova senha" htmlFor="newPassword" hint="Mínimo de 6 caracteres">
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </FormField>

            <FormField label="Confirmar nova senha" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </FormField>
          </div>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="sm:w-fit">Alterar senha</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
