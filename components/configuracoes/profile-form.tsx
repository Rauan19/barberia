'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { updateProfileAction } from '@/app/actions/perfil';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';

export function ProfileForm({
  name,
  email,
  barbershop,
}: {
  name: string;
  email: string;
  barbershop: string | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, idleState);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Dados atualizados!' });
    router.refresh();
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
        <CardDescription>Aparecem no menu e na saudação do dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Nome" htmlFor="name">
            <Input id="name" name="name" defaultValue={name} required />
          </FormField>

          <FormField label="Nome da barbearia" htmlFor="barbershop" hint="Opcional">
            <Input id="barbershop" name="barbershop" defaultValue={barbershop ?? ''} />
          </FormField>

          <FormField label="E-mail" htmlFor="email" hint="O e-mail de acesso não pode ser alterado.">
            <Input id="email" defaultValue={email} disabled />
          </FormField>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="sm:w-fit">Salvar</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
