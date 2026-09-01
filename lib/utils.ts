import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata centavos como moeda brasileira: 3050 -> "R$ 30,50" */
export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Formata centavos sem o simbolo: 3050 -> "30,50" */
export function formatAmount(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte texto digitado pelo usuario em centavos.
 * Aceita "30", "30,50", "R$ 1.234,56" e "1234.56".
 */
export function parseMoneyToCents(input: string | number): number {
  if (typeof input === 'number') return Math.round(input * 100);

  let value = input.trim().replace(/[^\d,.-]/g, '');
  if (!value) return 0;

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');

  if (lastComma > lastDot) {
    // formato pt-BR: 1.234,56
    value = value.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > -1 && lastComma > -1) {
    // formato en-US: 1,234.56
    value = value.replace(/,/g, '');
  } else {
    value = value.replace(',', '.');
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function formatPhone(phone?: string | null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

const CONNECTORS = new Set(['do', 'da', 'de', 'dos', 'das', 'e']);

export function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part && !CONNECTORS.has(part.toLowerCase()));
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/**
 * Variacao percentual entre dois valores.
 * Retorna null quando nao ha comparacao possivel (sem base ou sem movimento)
 * para nao poluir a tela com "0%" logo depois de criar a conta.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
