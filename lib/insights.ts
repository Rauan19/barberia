import 'server-only';

import {
  cutStats,
  financeSummary,
  monthGoalProgress,
  topClients,
  topServices,
} from '@/lib/analytics';
import { endOfMonthBR, startOfMonthBR, zonedParts, MONTH_NAMES } from '@/lib/date';
import { formatBRL, percentChange } from '@/lib/utils';
import type { Insight } from '@/components/dashboard/insights';

/** Frases automaticas sobre o mes corrente, exibidas no dashboard. */
export async function buildInsights(userId: string, now = new Date()): Promise<Insight[]> {
  const { year, month } = zonedParts(now);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const start = startOfMonthBR(year, month);
  const end = endOfMonthBR(year, month);
  const prevStart = startOfMonthBR(prevYear, prevMonth);
  const prevEnd = endOfMonthBR(prevYear, prevMonth);

  const [current, previous, services, clients, goal, finance] = await Promise.all([
    cutStats(userId, start, end),
    cutStats(userId, prevStart, prevEnd),
    topServices(userId, start, end, 1),
    topClients(userId, start, end, 1),
    monthGoalProgress(userId, now),
    financeSummary(userId, start, end),
  ]);

  const insights: Insight[] = [];

  const change = percentChange(current.revenueCents, previous.revenueCents);
  if (change !== null && previous.revenueCents > 0) {
    const direction = change >= 0 ? 'mais' : 'menos';
    insights.push({
      emoji: change >= 0 ? '📈' : '📉',
      text: `Você faturou ${Math.abs(change).toLocaleString('pt-BR', {
        maximumFractionDigits: 0,
      })}% ${direction} que em ${MONTH_NAMES[prevMonth - 1].toLowerCase()}.`,
    });
  } else if (current.revenueCents > 0) {
    insights.push({
      emoji: '📈',
      text: `Você já faturou ${formatBRL(current.revenueCents)} em ${MONTH_NAMES[
        month - 1
      ].toLowerCase()}.`,
    });
  }

  if (services[0]) {
    insights.push({
      emoji: '✂️',
      text: `Seu serviço mais vendido é ${services[0].name}, com ${services[0].cuts} atendimento(s).`,
    });
  }

  if (clients[0]) {
    insights.push({
      emoji: '👤',
      text: `${clients[0].name} é seu cliente mais frequente este mês (${clients[0].cuts} cortes).`,
    });
  }

  if (goal) {
    if (goal.cutsTarget > 0 && goal.cuts < goal.cutsTarget) {
      insights.push({
        emoji: '🎯',
        text: `Faltam ${goal.cutsTarget - goal.cuts} cortes para atingir sua meta mensal.`,
      });
    } else if (goal.revenueTarget > 0 && goal.revenueCents < goal.revenueTarget) {
      insights.push({
        emoji: '🎯',
        text: `Faltam ${formatBRL(
          goal.revenueTarget - goal.revenueCents,
        )} para bater a meta de faturamento.`,
      });
    } else if (goal.revenueTarget > 0 || goal.cutsTarget > 0) {
      insights.push({ emoji: '🏆', text: 'Meta do mês batida. Parabéns!' });
    }
  }

  if (finance.expenseCents > 0) {
    insights.push({
      emoji: '💵',
      text: `Depois de ${formatBRL(finance.expenseCents)} em despesas, sobraram ${formatBRL(
        finance.balanceCents,
      )}.`,
    });
  }

  if (current.ticketCents > 0) {
    insights.push({
      emoji: '📊',
      text: `Seu ticket médio no mês é de ${formatBRL(current.ticketCents)}.`,
    });
  }

  return insights;
}
