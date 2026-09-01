'use client';

import * as React from 'react';

import { FormField, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { PAYMENT_METHODS } from '@/lib/labels';
import { formatAmount } from '@/lib/utils';
import { toDateInput } from '@/lib/date';

export type ClientOption = { id: string; name: string };
export type ServiceOption = { id: string; name: string; priceCents: number };

export type CutDefaults = {
  clientId?: string | null;
  serviceId?: string | null;
  serviceName?: string;
  priceCents?: number;
  paymentMethod?: string;
  performedAt?: string;
  notes?: string | null;
};

const NEW_CLIENT = '__novo__';

export function CutFields({
  clients,
  services,
  defaults,
  lockClient = false,
}: {
  clients: ClientOption[];
  services: ServiceOption[];
  defaults?: CutDefaults;
  lockClient?: boolean;
}) {
  const [clientId, setClientId] = React.useState(defaults?.clientId ?? '');
  const [serviceId, setServiceId] = React.useState(defaults?.serviceId ?? '');
  const [price, setPrice] = React.useState(
    defaults?.priceCents !== undefined ? formatAmount(defaults.priceCents) : '',
  );

  function handleServiceChange(value: string) {
    setServiceId(value);
    const service = services.find((s) => s.id === value);
    if (service) setPrice(formatAmount(service.priceCents));
  }

  return (
    <div className="flex flex-col gap-4">
      {lockClient ? (
        <input type="hidden" name="clientId" value={defaults?.clientId ?? ''} />
      ) : (
        <FormField label="Cliente" htmlFor="clientId">
          <Select
            id="clientId"
            name={clientId === NEW_CLIENT ? 'ignored' : 'clientId'}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Sem cliente / avulso</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
            <option value={NEW_CLIENT}>+ Cadastrar novo cliente</option>
          </Select>
        </FormField>
      )}

      {clientId === NEW_CLIENT ? (
        <FormField
          label="Nome do novo cliente"
          htmlFor="clientName"
          hint="O cliente é criado junto com o corte."
        >
          <Input id="clientName" name="clientName" placeholder="Ex.: João Silva" required />
        </FormField>
      ) : null}

      <FormField label="Serviço" htmlFor="serviceId">
        <Select
          id="serviceId"
          name="serviceId"
          value={serviceId}
          onChange={(e) => handleServiceChange(e.target.value)}
        >
          <option value="">Outro (digitar)</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} (R$ {formatAmount(service.priceCents)})
            </option>
          ))}
        </Select>
      </FormField>

      {!serviceId ? (
        <FormField label="Nome do serviço" htmlFor="serviceName">
          <Input
            id="serviceName"
            name="serviceName"
            defaultValue={defaults?.serviceName ?? ''}
            placeholder="Ex.: Corte degradê"
            required
          />
        </FormField>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Valor" htmlFor="price">
          <MoneyInput id="price" name="price" value={price} onValueChange={setPrice} required />
        </FormField>

        <FormField label="Data" htmlFor="performedAt">
          <Input
            id="performedAt"
            name="performedAt"
            type="date"
            defaultValue={defaults?.performedAt ?? toDateInput(new Date())}
            required
          />
        </FormField>
      </div>

      <FormField label="Forma de pagamento" htmlFor="paymentMethod">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHODS.map((method, index) => (
            <label
              key={method.value}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-input bg-card px-2 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-medium has-[:checked]:text-primary"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                defaultChecked={
                  defaults?.paymentMethod
                    ? defaults.paymentMethod === method.value
                    : index === 0
                }
                className="sr-only"
              />
              <span aria-hidden>{method.emoji}</span>
              {method.label}
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="Observação" htmlFor="notes" hint="Opcional">
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaults?.notes ?? ''}
          placeholder="Ex.: cliente pediu máquina 2"
        />
      </FormField>
    </div>
  );
}
