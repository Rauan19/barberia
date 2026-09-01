import { Plus } from 'lucide-react';

import { prisma } from '@/lib/db';
import { CutDialog } from '@/components/cortes/cut-dialog';
import { ScrollAwareFab } from '@/components/layout/scroll-aware-fab';

/**
 * Botão flutuante de "registrar corte", sempre ao alcance do polegar.
 * So aparece no celular. No desktop cada pagina tem seu proprio botao.
 */
export async function QuickAction({ userId }: { userId: string }) {
  const [clients, services] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.service.findMany({
      where: { userId, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, priceCents: true },
    }),
  ]);

  return (
    <ScrollAwareFab>
      <CutDialog
        clients={clients}
        services={services}
        trigger={
          <button
            type="button"
            aria-label="Registrar corte"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        }
      />
    </ScrollAwareFab>
  );
}
