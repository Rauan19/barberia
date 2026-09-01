'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBRL } from '@/lib/utils';

export type ChartPoint = {
  label: string;
  weekday: string;
  revenue: number;
  cuts: number;
};

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  const compact = data.length > 10;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey={compact ? 'label' : 'weekday'}
            tickLine={false}
            axisLine={false}
            interval={compact ? 'preserveStartEnd' : 0}
            minTickGap={12}
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
            cursor={{ stroke: 'hsl(var(--border))' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              fontSize: 13,
            }}
            formatter={((value: number, _name: string, item: { payload?: ChartPoint }) => [
              `${formatBRL(Math.round(value * 100))} · ${item?.payload?.cuts ?? 0} corte(s)`,
              'Faturamento',
            ]) as never}
            labelFormatter={((_label: string, payload: { payload?: ChartPoint }[]) =>
              payload?.[0]?.payload?.label ?? '') as never}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
