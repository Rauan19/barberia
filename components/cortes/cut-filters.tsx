import { Select } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { PAYMENT_METHODS } from '@/lib/labels';
import { PERIOD_OPTIONS, type Period } from '@/lib/period';
import { Input } from '@/components/ui/field';
import { toDateInput } from '@/lib/date';

export function CutFilters({
  period,
  clients,
  serviceNames,
  selected,
}: {
  period: Period;
  clients: { id: string; name: string }[];
  serviceNames: string[];
  selected: { cliente?: string; servico?: string; pagamento?: string };
}) {
  return (
    <FilterForm className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select name="periodo" defaultValue={period.preset} aria-label="Período">
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select name="cliente" defaultValue={selected.cliente ?? ''} aria-label="Cliente">
        <option value="">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </Select>

      <Select name="servico" defaultValue={selected.servico ?? ''} aria-label="Serviço">
        <option value="">Todos os serviços</option>
        {serviceNames.map((name) => (
          <option key={name} value={name}>
            {name}
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
        <>
          <Input type="date" name="de" defaultValue={toDateInput(period.start)} />
          <Input type="date" name="ate" defaultValue={toDateInput(period.end)} />
        </>
      ) : null}
    </FilterForm>
  );
}
