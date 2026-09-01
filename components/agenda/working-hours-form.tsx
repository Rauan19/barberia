'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { saveWorkingHoursAction } from '@/app/actions/horarios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, Input, Select } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { useToast } from '@/components/ui/toast';
import { idleState } from '@/lib/action-state';
import { WEEKDAY_LABELS, minutesToLabel } from '@/lib/schedule';
import { cn } from '@/lib/utils';

export type WorkingHourRow = {
  weekday: number;
  open: boolean;
  startMinute: number;
  endMinute: number;
  breakStart: number | null;
  breakEnd: number | null;
};

export function WorkingHoursForm({
  hours,
  slotMinutes,
  bookingDays,
  bookingOpen,
}: {
  hours: WorkingHourRow[];
  slotMinutes: number;
  bookingDays: number;
  bookingOpen: boolean;
}) {
  const [state, formAction] = useActionState(saveWorkingHoursAction, idleState);
  const [openDays, setOpenDays] = React.useState<Record<number, boolean>>(
    Object.fromEntries(hours.map((hour) => [hour.weekday, hour.open])),
  );
  const toast = useToast();
  const router = useRouter();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!state.ok || handled.current) return;
    handled.current = true;
    toast({ title: state.message ?? 'Agenda salva!' });
    router.refresh();
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajuste fino, dia a dia</CardTitle>
        <CardDescription>
          Use quando algum dia tem horário diferente dos outros: sábado que abre mais
          cedo, quarta sem almoço, e por aí.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={(formData) => {
            handled.current = false;
            formAction(formData);
          }}
          className="flex flex-col gap-4"
        >
          <ul className="flex flex-col gap-2">
            {hours.map((hour) => {
              const isOpen = openDays[hour.weekday] ?? hour.open;
              return (
                <li
                  key={hour.weekday}
                  className={cn(
                    'rounded-xl border p-3 transition-colors',
                    isOpen ? 'border-border bg-card' : 'border-dashed border-border bg-muted/40',
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name={`open-${hour.weekday}`}
                      defaultChecked={hour.open}
                      onChange={(e) =>
                        setOpenDays((prev) => ({
                          ...prev,
                          [hour.weekday]: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
                    />
                    <span className="flex-1 font-medium">{WEEKDAY_LABELS[hour.weekday]}</span>
                    {!isOpen ? (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    ) : null}
                  </label>

                  {isOpen ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <FormField label="Abre" htmlFor={`start-${hour.weekday}`}>
                        <Input
                          id={`start-${hour.weekday}`}
                          name={`start-${hour.weekday}`}
                          type="time"
                          step={300}
                          defaultValue={minutesToLabel(hour.startMinute)}
                        />
                      </FormField>
                      <FormField label="Fecha" htmlFor={`end-${hour.weekday}`}>
                        <Input
                          id={`end-${hour.weekday}`}
                          name={`end-${hour.weekday}`}
                          type="time"
                          step={300}
                          defaultValue={minutesToLabel(hour.endMinute)}
                        />
                      </FormField>
                      <FormField label="Intervalo de" htmlFor={`breakStart-${hour.weekday}`}>
                        <Input
                          id={`breakStart-${hour.weekday}`}
                          name={`breakStart-${hour.weekday}`}
                          type="time"
                          step={300}
                          defaultValue={
                            hour.breakStart !== null ? minutesToLabel(hour.breakStart) : ''
                          }
                        />
                      </FormField>
                      <FormField label="até" htmlFor={`breakEnd-${hour.weekday}`}>
                        <Input
                          id={`breakEnd-${hour.weekday}`}
                          name={`breakEnd-${hour.weekday}`}
                          type="time"
                          step={300}
                          defaultValue={
                            hour.breakEnd !== null ? minutesToLabel(hour.breakEnd) : ''
                          }
                        />
                      </FormField>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
            <FormField
              label="Intervalo entre horários"
              htmlFor="slotMinutes"
              hint="De quanto em quanto tempo os horários aparecem."
            >
              <Select id="slotMinutes" name="slotMinutes" defaultValue={String(slotMinutes)}>
                {[10, 15, 20, 30, 45, 60].map((value) => (
                  <option key={value} value={value}>
                    {value} minutos
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Agendar com até"
              htmlFor="bookingDays"
              hint="Quantos dias para frente o cliente enxerga."
            >
              <Select id="bookingDays" name="bookingDays" defaultValue={String(bookingDays)}>
                {[7, 14, 21, 30, 60].map((value) => (
                  <option key={value} value={value}>
                    {value} dias
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Agendamento online">
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-card px-3 text-sm">
                <input
                  type="checkbox"
                  name="bookingOpen"
                  defaultChecked={bookingOpen}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                Aceitar agendamentos
              </label>
            </FormField>
          </div>

          {state.error ? (
            <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <SubmitButton className="sm:w-fit">Salvar agenda</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
