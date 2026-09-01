'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { saveGoalAction } from '@/app/actions/metas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, Input, Select } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { MONTH_NAMES } from '@/lib/date';
import { formatAmount } from '@/lib/utils';

export function GoalForm({
  year,
  month,
  years,
  current,
}: {
  year: number;
  month: number;
  years: number[];
  current: { revenueTarget: number; cutsTarget: number } | null;
}) {
  const [state, formAction] = useActionState(saveGoalAction, idleState);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Meta salva!' });
    router.refresh();
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{current ? 'Atualizar meta' : 'Definir meta'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Mês" htmlFor="month">
              <Select id="month" name="month" defaultValue={String(month)}>
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Ano" htmlFor="year">
              <Select id="year" name="year" defaultValue={String(year)}>
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Meta de faturamento" htmlFor="revenueTarget">
              <MoneyInput
                id="revenueTarget"
                name="revenueTarget"
                defaultValue={current ? formatAmount(current.revenueTarget) : ''}
              />
            </FormField>

            <FormField label="Meta de cortes" htmlFor="cutsTarget">
              <Input
                id="cutsTarget"
                name="cutsTarget"
                type="number"
                min={0}
                defaultValue={current?.cutsTarget ?? ''}
                placeholder="150"
              />
            </FormField>
          </div>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="sm:w-fit">Salvar meta</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
