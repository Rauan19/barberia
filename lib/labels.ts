import type { PaymentMethod, TransactionCategory, TransactionType } from '@prisma/client';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'PIX', label: 'Pix', emoji: '⚡' },
  { value: 'DINHEIRO', label: 'Dinheiro', emoji: '💵' },
  { value: 'CARTAO', label: 'Cartão', emoji: '💳' },
  { value: 'OUTRO', label: 'Outro', emoji: '🔁' },
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  OUTRO: 'Outro',
};

export const INCOME_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'CORTE', label: 'Corte / atendimento' },
  { value: 'VENDA_PRODUTO', label: 'Venda de produto' },
  { value: 'GORJETA', label: 'Gorjeta' },
  { value: 'SERVICO_EXTERNO', label: 'Serviço externo' },
  { value: 'OUTRAS_ENTRADAS', label: 'Outras entradas' },
];

export const EXPENSE_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'PRODUTOS', label: 'Produtos' },
  { value: 'ALUGUEL', label: 'Aluguel' },
  { value: 'ENERGIA', label: 'Energia' },
  { value: 'AGUA', label: 'Água' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'EQUIPAMENTOS', label: 'Equipamentos' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'FUNCIONARIOS', label: 'Funcionários' },
  { value: 'OUTRAS_SAIDAS', label: 'Outras saídas' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const CATEGORY_LABEL = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<TransactionCategory, string>;

export const CATEGORY_EMOJI: Record<TransactionCategory, string> = {
  CORTE: '✂️',
  VENDA_PRODUTO: '🧴',
  GORJETA: '🪙',
  SERVICO_EXTERNO: '🚗',
  OUTRAS_ENTRADAS: '📥',
  PRODUTOS: '🧴',
  ALUGUEL: '🏠',
  ENERGIA: '💡',
  AGUA: '🚰',
  INTERNET: '🌐',
  EQUIPAMENTOS: '🛠️',
  MANUTENCAO: '🔧',
  MARKETING: '📣',
  FUNCIONARIOS: '👥',
  OUTRAS_SAIDAS: '📤',
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  INCOME: 'Entrada',
  EXPENSE: 'Saída',
};

import type { AppointmentStatus } from '@prisma/client';

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Aguardando',
  CONFIRMED: 'Confirmado',
  DONE: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Faltou',
};

export const STATUS_TONE: Record<AppointmentStatus, 'default' | 'muted' | 'success' | 'danger' | 'outline'> = {
  PENDING: 'default',
  CONFIRMED: 'outline',
  DONE: 'success',
  CANCELED: 'muted',
  NO_SHOW: 'danger',
};
