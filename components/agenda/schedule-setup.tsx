'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarPlus, Info } from 'lucide-react';

import { setupScheduleAction } from '@/app/actions/horarios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, Input, Select } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { WEEKDAY_SHORT_LABELS, minutesToLabel, SUGGESTED_SCHEDULE } from '@/lib/schedule';
import { cn } from '@/lib/utils';

/**
 * Montador de agenda. Escolhe os dias de trabalho e aplica o mesmo horario
 * a todos de uma vez. E o passo que libera o agendamento online.
 */
export function ScheduleSetup({
  configured,
  slotMinutes,
}: {
  configured: boolean;
  slotMinutes: number;
}) {
  const [days, setDays] = React.useState<number[]>([]);
  const [hasBreak, setHasBreak] = React.useState(true);
  const [state, formAction] = useActionState(setupScheduleAction, idleState);
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Agenda criada!' });
    router.refresh();
  }, [state, toast, router]);

  function toggle(weekday: number) {
    setDays((prev) =>
      prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday],
    );
  }

  return (
    <Card className={configured ? undefined : 'border-primary/50 bg-primary/[0.03]'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-primary" />
          {configured ? 'Refazer a agenda' : 'Monte sua agenda'}
        </CardTitle>
        <CardDescription>
          {configured
            ? 'Aplica os mesmos horários aos dias escolhidos, substituindo o que está definido abaixo.'
            : 'Escolha em quais dias você atende e em que horário. Enquanto isso não for definido, ninguém consegue agendar com você.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-5"
        >
          <div>
            <p className="mb-2 text-sm font-medium">Em quais dias você atende?</p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_SHORT_LABELS.map((label, weekday) => {
                const active = days.includes(weekday);
                return (
                  <button
                    key={weekday}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(weekday)}
                    className={cn(
                      'flex min-h-[52px] flex-col items-center justify-center rounded-lg border-2 text-xs font-semibold transition-all active:scale-95',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-card text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {days.map((weekday) => (
              <input key={weekday} type="hidden" name="weekdays" value={weekday} />
            ))}
            <button
              type="button"
              onClick={() => setDays(days.length === 0 ? [...SUGGESTED_SCHEDULE.weekdays] : [])}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              {days.length === 0 ? 'Usar segunda a sábado' : 'Limpar seleção'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Abre às" htmlFor="startMinute">
              <Input
                id="startMinute"
                name="startMinute"
                type="time"
                step={300}
                defaultValue={minutesToLabel(SUGGESTED_SCHEDULE.startMinute)}
                required
              />
            </FormField>
            <FormField label="Fecha às" htmlFor="endMinute">
              <Input
                id="endMinute"
                name="endMinute"
                type="time"
                step={300}
                defaultValue={minutesToLabel(SUGGESTED_SCHEDULE.endMinute)}
                required
              />
            </FormField>
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                name="hasBreak"
                checked={hasBreak}
                onChange={(e) => setHasBreak(e.target.checked)}
                className="h-5 w-5 accent-[hsl(var(--primary))]"
              />
              Tenho intervalo de almoço
            </label>

            {hasBreak ? (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <FormField label="Almoço de" htmlFor="breakStart">
                  <Input
                    id="breakStart"
                    name="breakStart"
                    type="time"
                    step={300}
                    defaultValue={minutesToLabel(SUGGESTED_SCHEDULE.breakStart)}
                  />
                </FormField>
                <FormField label="até" htmlFor="breakEnd">
                  <Input
                    id="breakEnd"
                    name="breakEnd"
                    type="time"
                    step={300}
                    defaultValue={minutesToLabel(SUGGESTED_SCHEDULE.breakEnd)}
                  />
                </FormField>
              </div>
            ) : null}
          </div>

          <FormField
            label="Abrir horário a cada"
            htmlFor="setupSlotMinutes"
            hint="Ex.: de 30 em 30 min mostra 09:00, 09:30, 10:00…"
          >
            <Select id="setupSlotMinutes" name="slotMinutes" defaultValue={String(slotMinutes)}>
              {[10, 15, 20, 30, 45, 60].map((value) => (
                <option key={value} value={value}>
                  {value} minutos
                </option>
              ))}
            </Select>
          </FormField>

          <p className="flex items-start gap-2 rounded-md bg-muted p-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Isso é a sua semana padrão. Folgas e compromissos de datas específicas você
            marca logo abaixo, em <strong className="font-medium">Bloquear horário</strong>.
          </p>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton disabled={days.length === 0} className="sm:w-fit">
            {configured ? 'Aplicar aos dias escolhidos' : 'Criar agenda e abrir agendamento'}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
