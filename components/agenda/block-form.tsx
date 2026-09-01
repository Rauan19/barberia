'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarOff } from 'lucide-react';

import { createTimeBlockAction } from '@/app/actions/horarios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { toDateInput } from '@/lib/date';

export function BlockForm() {
  const [allDay, setAllDay] = React.useState(true);
  const [state, formAction] = useActionState(createTimeBlockAction, idleState);
  const toast = useToast();
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Bloqueio criado!' });
    formRef.current?.reset();
    router.refresh();
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-4 w-4" />
          Bloquear horário
        </CardTitle>
        <CardDescription>
          Folga, compromisso ou feriado. O horário some da página pública.
        </CardDescription>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Data" htmlFor="date">
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={toDateInput(new Date())}
                required
              />
            </FormField>

            <FormField label="Motivo" htmlFor="reason" hint="Opcional">
              <Input id="reason" name="reason" placeholder="Ex.: consulta médica" />
            </FormField>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              name="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-5 w-5 accent-[hsl(var(--primary))]"
            />
            Bloquear o dia inteiro
          </label>

          {!allDay ? (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Das" htmlFor="start">
                <Input id="start" name="start" type="time" step={300} required />
              </FormField>
              <FormField label="Até" htmlFor="end">
                <Input id="end" name="end" type="time" step={300} required />
              </FormField>
            </div>
          ) : null}

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="sm:w-fit">Bloquear</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
