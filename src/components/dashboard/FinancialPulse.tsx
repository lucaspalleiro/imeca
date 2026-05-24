'use client';
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { FinancialPulse as FinancialPulseType } from '../../types';
import { TrendingUp, AlertCircle, DollarSign, Clock } from 'lucide-react';

interface FinancialPulseProps {
  data: FinancialPulseType;
  tvSize?: boolean;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const pct = (value: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

const chartData = [
  { label: 'Ene', billing: 98, target: 150 },
  { label: 'Feb', billing: 120, target: 150 },
  { label: 'Mar', billing: 145, target: 150 },
  { label: 'Abr', billing: 112, target: 150 },
  { label: 'May', billing: 128, target: 150 },
];

export const FinancialPulse: React.FC<FinancialPulseProps> = ({ data, tvSize = false }) => {
  const billingPct = pct(data.billing_monthly, data.billing_target);
  const marginColor =
    data.gross_margin_avg >= 25 ? '#22c55e' : data.gross_margin_avg >= 18 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: 'Facturado (mes)',
            value: fmt(data.billing_monthly),
            sub: `Meta: ${fmt(data.billing_target)}`,
            color: billingPct >= 80 ? '#22c55e' : '#eab308',
            icon: <DollarSign size={16} />,
          },
          {
            label: 'Proyección del Mes',
            value: fmt(data.billing_projected),
            sub: `${pct(data.billing_projected, data.billing_target)}% de meta`,
            color: '#f97316',
            icon: <TrendingUp size={16} />,
          },
          {
            label: 'Deuda Vencida',
            value: fmt(data.overdue_debt),
            sub: 'Cobros atrasados',
            color: '#ef4444',
            icon: <AlertCircle size={16} />,
          },
          {
            label: 'Cuentas a Cobrar',
            value: fmt(data.accounts_receivable),
            sub: `Pendientes: ${fmt(data.pending_invoices)}`,
            color: '#3b82f6',
            icon: <Clock size={16} />,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                {item.label}
              </span>
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <span
              className={`font-bold tracking-tight text-white ${tvSize ? 'text-3xl' : 'text-2xl'}`}
              style={{ color: item.color }}
            >
              {item.value}
            </span>
            <span className="text-xs text-zinc-500">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Billing Progress Bar */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
            Avance de Facturación vs Meta Mensual
          </span>
          <span className="text-xs font-bold text-white">{billingPct}%</span>
        </div>
        <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${billingPct}%`,
              background: billingPct >= 80
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #eab308, #ca8a04)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-600">ARS 0</span>
          <span className="text-[10px] text-zinc-600">{fmt(data.billing_target)}</span>
        </div>
      </div>

      {/* Margin & Cashflow */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            Margen Bruto Promedio
          </span>
          <span
            className={`font-bold ${tvSize ? 'text-4xl' : 'text-3xl'}`}
            style={{ color: marginColor }}
          >
            {data.gross_margin_avg}%
          </span>
          <span className="text-[10px] text-zinc-600">Meta: ≥ 25%</span>
          <div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (data.gross_margin_avg / 35) * 100)}%`,
                background: marginColor,
              }}
            />
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            Cashflow Estimado
          </span>
          <span className={`font-bold text-white ${tvSize ? 'text-4xl' : 'text-3xl'}`}>
            {fmt(data.estimated_cashflow)}
          </span>
          <span className="text-[10px] text-zinc-600">Proyección cierre de mes</span>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-3">
          Facturación vs Meta — Últimos 5 Meses (ARS M)
        </span>
        <ResponsiveContainer width="100%" height={tvSize ? 180 : 140}>
          <BarChart data={chartData} barGap={4}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#52525b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#52525b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`ARS ${value}M`, '']}
            />
            <Bar dataKey="target" fill="#27272a" radius={[4, 4, 0, 0]} name="Meta" />
            <Bar dataKey="billing" radius={[4, 4, 0, 0]} name="Facturado">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.billing >= entry.target ? '#22c55e' : entry.billing >= entry.target * 0.8 ? '#f97316' : '#eab308'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
