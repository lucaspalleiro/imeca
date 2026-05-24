'use client';
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from 'recharts';
import { Project } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HHTrendsProps {
  projects: Project[];
  tvSize?: boolean;
}

export const HHTrends: React.FC<HHTrendsProps> = ({ projects, tvSize = false }) => {
  const data = projects.map((p) => {
    const deviation = p.consumed_hh - p.budgeted_hh;
    const pct = p.budgeted_hh > 0
      ? Math.round((p.consumed_hh / p.budgeted_hh) * 100)
      : 0;
    return {
      name: p.code,
      fullName: p.name,
      budgeted: p.budgeted_hh,
      consumed: p.consumed_hh,
      projected: p.projected_hh,
      deviation,
      pct,
    };
  });

  const totalBudgeted = projects.reduce((s, p) => s + p.budgeted_hh, 0);
  const totalConsumed = projects.reduce((s, p) => s + p.consumed_hh, 0);
  const totalProjected = projects.reduce((s, p) => s + p.projected_hh, 0);
  const globalDeviation = totalConsumed - totalBudgeted;
  const globalDeviationPct = totalBudgeted > 0
    ? ((totalConsumed / totalBudgeted) * 100 - 100).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">HH Presupuestadas</span>
          <div className={`font-bold text-white mt-1 ${tvSize ? 'text-3xl' : 'text-2xl'}`}>
            {totalBudgeted.toLocaleString()} hs
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">HH Consumidas</span>
          <div
            className={`font-bold mt-1 ${tvSize ? 'text-3xl' : 'text-2xl'}`}
            style={{ color: totalConsumed > totalBudgeted ? '#ef4444' : '#22c55e' }}
          >
            {totalConsumed.toLocaleString()} hs
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Desvío Global</span>
          <div className="flex items-center gap-2 mt-1">
            {globalDeviation > 0
              ? <TrendingUp size={18} className="text-red-400" />
              : globalDeviation < 0
                ? <TrendingDown size={18} className="text-green-400" />
                : <Minus size={18} className="text-zinc-500" />}
            <span
              className={`font-bold ${tvSize ? 'text-3xl' : 'text-2xl'}`}
              style={{ color: globalDeviation > 0 ? '#ef4444' : '#22c55e' }}
            >
              {globalDeviation > 0 ? '+' : ''}{globalDeviation.toLocaleString()} hs
            </span>
            <span className="text-xs text-zinc-500">({globalDeviationPct}%)</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-4">
          HH Real vs Presupuestadas por Obra
        </span>
        <ResponsiveContainer width="100%" height={tvSize ? 260 : 200}>
          <BarChart data={data} barGap={2} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fill: '#52525b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#52525b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                `${Number(value).toLocaleString()} hs`,
                name === 'budgeted' ? 'Presupuestadas' : name === 'consumed' ? 'Consumidas' : 'Proyectadas',
              ]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.name === label);
                return item ? item.fullName : label;
              }}
            />
            <ReferenceLine y={0} stroke="#3f3f46" />
            <Bar dataKey="budgeted" fill="#3f3f46" radius={[3, 3, 0, 0]} name="budgeted" />
            <Bar dataKey="consumed" radius={[3, 3, 0, 0]} name="consumed">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.consumed > entry.budgeted ? '#ef4444' : '#f97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Project Mini Table */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left p-3 text-zinc-500 font-medium uppercase tracking-wider">Obra</th>
              <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Presup.</th>
              <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Consumido</th>
              <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Proyectado</th>
              <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">% Uso</th>
              <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Desvío</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.name} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? '' : 'bg-zinc-950/30'}`}>
                <td className="p-3 text-zinc-300 font-mono text-[10px]">{row.name}</td>
                <td className="p-3 text-right text-zinc-400">{row.budgeted.toLocaleString()}</td>
                <td
                  className="p-3 text-right font-semibold"
                  style={{ color: row.consumed > row.budgeted ? '#ef4444' : '#f4f4f5' }}
                >
                  {row.consumed.toLocaleString()}
                </td>
                <td
                  className="p-3 text-right"
                  style={{ color: row.projected > row.budgeted ? '#eab308' : '#52525b' }}
                >
                  {row.projected.toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, row.pct)}%`,
                          background: row.pct > 100 ? '#ef4444' : row.pct > 85 ? '#eab308' : '#22c55e',
                        }}
                      />
                    </div>
                    <span style={{ color: row.pct > 100 ? '#ef4444' : row.pct > 85 ? '#eab308' : '#a1a1aa' }}>
                      {row.pct}%
                    </span>
                  </div>
                </td>
                <td
                  className="p-3 text-right font-semibold"
                  style={{ color: row.deviation > 0 ? '#ef4444' : '#22c55e' }}
                >
                  {row.deviation > 0 ? '+' : ''}{row.deviation.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
