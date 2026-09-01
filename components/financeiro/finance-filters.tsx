import Link from 'next/link';

import { Input, Select } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { ALL_CATEGORIES, PAYMENT_METHODS } from '@/lib/labels';
import { PERIOD_OPTIONS, type Period } from '@/lib/period';
import { toDateInput } from '@/lib/date';
import { cn } from '@/lib/utils';

const TABS = [
  { value: '', label: 'Todas' },
  { value: 'INCOME', label: 'Entradas' },
  { value: 'EXPENSE', label: 'Saídas' },
];

export function FinanceFilters({
  period,
  selected,
}: {
  period: Period;
  selected: { tipo?: string; categoria?: string; pagamento?: string };
}) {
  const buildHref = (tipo: string) => {
    const params = new URLSearchParams();
    params.set('periodo', period.preset);
    if (period.preset === 'custom') {
      params.set('de', toDateInput(period.start));
      params.set('ate', toDateInput(period.end));
    }
    if (tipo) params.set('tipo', tipo);
    if (selected.categoria) params.set('categoria', selected.categoria);
    if (selected.pagamento) params.set('pagamento', selected.pagamento);
    return `/dashboard/financeiro?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-fit gap-1 rounded-lg bg-secondary p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildHref(tab.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              (selected.tipo ?? '') === tab.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <FilterForm className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="tipo" value={selected.tipo ?? ''} />

        <Select name="periodo" defaultValue={period.preset} aria-label="Período">
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          name="categoria"
          defaultValue={selected.categoria ?? ''}
          aria-label="Categoria"
        >
          <option value="">Todas as categorias</option>
          {ALL_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>

        <Select
          name="pagamento"
          defaultValue={selected.pagamento ?? ''}
          aria-label="Forma de pagamento"
        >
          <option value="">Todos os pagamentos</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>

        {period.preset === 'custom' ? (
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" name="de" defaultValue={toDateInput(period.start)} />
            <Input type="date" name="ate" defaultValue={toDateInput(period.end)} />
          </div>
        ) : null}
      </FilterForm>
    </div>
  );
}
