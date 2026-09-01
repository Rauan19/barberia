'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBRL } from '@/lib/utils';

export type FinancePoint = {
  label: string;
  weekday: string;
  entradas: number;
  saidas: number;
};

export function FinanceChart({ data }: { data: FinancePoint[] }) {
  const compact = data.length > 10;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey={compact ? 'label' : 'weekday'}
            tickLine={false}
            axisLine={false}
            interval={compact ? 'preserveStartEnd' : 0}
            minTickGap={16}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
            }
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              fontSize: 13,
            }}
            formatter={((value: number, name: string) => [
              formatBRL(Math.round(value * 100)),
              name,
            ]) as never}
            labelFormatter={((_label: string, payload: { payload?: FinancePoint }[]) =>
              payload?.[0]?.payload?.label ?? '') as never}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="saidas"
            name="Saídas"
            fill="hsl(var(--destructive))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
