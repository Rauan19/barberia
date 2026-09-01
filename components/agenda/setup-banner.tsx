import Link from 'next/link';
import { CalendarPlus, ArrowRight } from 'lucide-react';

import { Card } from '@/components/ui/card';

/**
 * Aparece enquanto o barbeiro nao definiu os dias em que trabalha.
 * Ate la, a pagina publica nao aceita agendamento: nada e assumido por ele.
 */
export function SetupBanner() {
  return (
    <Card className="border-primary/50 bg-primary/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarPlus className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Monte sua agenda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha em quais dias e horários você atende. Enquanto isso não for definido,
            sua página de agendamento fica fechada e ninguém marca horário com você.
          </p>
          <Link
            href="/dashboard/agenda/horarios"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Definir meus dias
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
