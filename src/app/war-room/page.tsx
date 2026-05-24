'use client';
import React, { useEffect } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { useTVMode } from '../../hooks/useTVMode';
import { Project, ProjectStatus, Alert, AlertSeverity, Crew, Employee, FinancialPulse as FPType } from '../../types';
import {
  Maximize2, Play, Pause, ChevronLeft, ChevronRight, Settings, X,
  Building2, AlertTriangle, DollarSign, BarChart3, Users,
  ShieldAlert, Activity, TrendingUp, TrendingDown, Minus,
  CheckCircle, AlertCircle, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import Link from 'next/link';

// ─── Panel definitions ───────────────────────────────────────────────────────
const PANELS = [
  { id: 0, label: 'Estado de Obras',   icon: Building2 },
  { id: 1, label: 'Alertas Críticas',  icon: AlertTriangle },
  { id: 2, label: 'Pulso Financiero',  icon: DollarSign },
  { id: 3, label: 'Horas Hombre',      icon: BarChart3 },
  { id: 4, label: 'RRHH y Cuadrillas', icon: Users },
];

// ─── Shared status config ─────────────────────────────────────────────────────
const STATUS_CFG: Record<ProjectStatus, { label: string; bar: string; badge: string; borderLeft: string }> = {
  en_plazo:  { label: 'En Plazo',  bar: 'bg-industrial-green',  badge: 'bg-industrial-green/10  text-industrial-green  border border-industrial-green/30',  borderLeft: '' },
  en_riesgo: { label: 'En Riesgo', bar: 'bg-industrial-yellow', badge: 'bg-industrial-yellow/10 text-industrial-yellow border border-industrial-yellow/30', borderLeft: 'border-l-4 border-l-industrial-yellow' },
  atrasada:  { label: 'Atrasada',  bar: 'bg-industrial-red',    badge: 'bg-industrial-red/10    text-industrial-red    border border-industrial-red/30',    borderLeft: 'border-l-4 border-l-industrial-red' },
  por_cerrar:{ label: 'Por Cerrar',bar: 'bg-industrial-green',  badge: 'bg-industrial-blue/10   text-industrial-blue   border border-industrial-blue/30',   borderLeft: '' },
  detenida:  { label: 'Detenida',  bar: 'bg-zinc-500',          badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700',                                  borderLeft: 'border-l-4 border-l-zinc-600' },
};

// ─── Panel 0: Projects ────────────────────────────────────────────────────────
function TVProjects({ projects }: { projects: Project[] }) {
  const rows = Math.ceil(projects.length / 2);
  return (
    <div
      className="grid grid-cols-2 gap-3 h-full"
      style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {projects.map((p) => {
        const pct = Math.min(100, Math.round((p.consumed_hh / p.budgeted_hh) * 100));
        const cfg = STATUS_CFG[p.status];
        const overrun = p.consumed_hh > p.budgeted_hh;
        return (
          <div
            key={p.id}
            className={`rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-between min-h-0 ${cfg.borderLeft}`}
          >
            {/* Name + badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-zinc-600 font-mono">{p.code}</span>
                <p className="text-sm font-bold text-white leading-tight truncate mt-0.5">{p.name}</p>
                <p className="text-xs text-zinc-500 truncate">{p.client_name} · {p.manager_name}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">
                  HH: {p.consumed_hh.toLocaleString()} / {p.budgeted_hh.toLocaleString()}
                </span>
                <span className={overrun ? 'text-industrial-red font-bold' : 'text-zinc-400'}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-500">Fin: {p.end_date_contractual}</span>
              <span className={p.real_margin < p.margin_estimated ? 'text-industrial-red font-semibold' : 'text-industrial-green font-semibold'}>
                Margen: {p.real_margin}%
              </span>
              {p.potential_penalties > 0 && (
                <span className="text-industrial-red font-semibold ml-auto">
                  Multa: ${(p.potential_penalties / 1_000_000).toFixed(1)}M
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel 1: Alerts ──────────────────────────────────────────────────────────
const ALERT_CFG: Record<AlertSeverity, { bg: string; borderLeft: string; text: string; label: string; icon: React.ReactNode }> = {
  critical: { bg: 'bg-industrial-red/5',    borderLeft: 'border-l-4 border-l-industrial-red',    text: 'text-industrial-red',    label: 'CRÍTICA',      icon: <ShieldAlert   size={18} className="text-industrial-red    shrink-0" /> },
  warning:  { bg: 'bg-industrial-yellow/5', borderLeft: 'border-l-4 border-l-industrial-yellow', text: 'text-industrial-yellow', label: 'ADVERTENCIA',  icon: <AlertTriangle size={18} className="text-industrial-yellow shrink-0" /> },
  info:     { bg: 'bg-industrial-blue/5',   borderLeft: 'border-l-4 border-l-industrial-blue',   text: 'text-industrial-blue',   label: 'INFO',         icon: <Activity      size={18} className="text-industrial-blue   shrink-0" /> },
};

function TVAlerts({ alerts }: { alerts: Alert[] }) {
  const active = alerts.filter((a) => a.status !== 'resolved');
  if (active.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-industrial-green/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-industrial-green" />
          </div>
          <p className="text-2xl font-bold text-white">Sin Alertas Activas</p>
          <p className="text-zinc-500 mt-1">Todas las operaciones dentro de parámetros normales</p>
        </div>
      </div>
    );
  }
  const shown = active.slice(0, 6);
  const cols = shown.length <= 3 ? 1 : 2;
  return (
    <div
      className="grid gap-3 h-full"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(shown.length / cols)}, 1fr)`,
      }}
    >
      {shown.map((a) => {
        const cfg = ALERT_CFG[a.severity];
        return (
          <div
            key={a.id}
            className={`rounded-xl border border-zinc-800 p-4 flex flex-col gap-2 min-h-0 ${cfg.bg} ${cfg.borderLeft}`}
          >
            <div className="flex items-center gap-2 shrink-0">
              {cfg.icon}
              <span className="font-bold text-white text-sm truncate">
                {a.type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.text}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-snug line-clamp-3 flex-1">{a.message}</p>
            {a.project_name && (
              <p className="text-xs text-zinc-500 shrink-0 truncate">Obra: {a.project_name}</p>
            )}
            {a.suggested_action && (
              <p className="text-xs text-zinc-600 italic line-clamp-1 shrink-0">→ {a.suggested_action}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel 2: Financial ───────────────────────────────────────────────────────
const fmtARS = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};
const billingHistory = [
  { label: 'Ene', billing: 98, target: 150 },
  { label: 'Feb', billing: 120, target: 150 },
  { label: 'Mar', billing: 145, target: 150 },
  { label: 'Abr', billing: 112, target: 150 },
  { label: 'May', billing: 128, target: 150 },
];

function TVFinancial({ data }: { data: FPType }) {
  const billingPct = Math.min(100, Math.round((data.billing_monthly / data.billing_target) * 100));
  const marginColor = data.gross_margin_avg >= 25 ? '#22c55e' : data.gross_margin_avg >= 18 ? '#eab308' : '#ef4444';
  const kpis = [
    { label: 'Facturado (mes)',    value: fmtARS(data.billing_monthly),   sub: `Meta: ${fmtARS(data.billing_target)}`,                              color: billingPct >= 80 ? '#22c55e' : '#eab308', icon: DollarSign  },
    { label: 'Proyección Mes',     value: fmtARS(data.billing_projected), sub: `${Math.round((data.billing_projected / data.billing_target) * 100)}% de meta`, color: '#f97316', icon: TrendingUp },
    { label: 'Deuda Vencida',      value: fmtARS(data.overdue_debt),      sub: 'Cobros atrasados',                                                  color: '#ef4444',                                icon: AlertCircle },
    { label: 'Cuentas a Cobrar',   value: fmtARS(data.accounts_receivable),sub: `Pendientes: ${fmtARS(data.pending_invoices)}`,                     color: '#3b82f6',                                icon: Clock       },
  ];

  return (
    <div className="h-full flex flex-col gap-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{k.label}</span>
              <k.icon size={14} style={{ color: k.color }} />
            </div>
            <span className="font-bold text-3xl tracking-tight mt-1" style={{ color: k.color }}>{k.value}</span>
            <span className="text-xs text-zinc-500">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Progress + Margin + Cashflow */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-2">
            Avance Facturación vs Meta
          </span>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-400">{billingPct}% completado</span>
            <span className="text-zinc-400">{fmtARS(data.billing_target)}</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${billingPct}%`,
                background: billingPct >= 80
                  ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                  : 'linear-gradient(90deg,#eab308,#ca8a04)',
              }}
            />
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Margen Bruto Promedio</span>
          <span className="font-bold text-4xl mt-1 block" style={{ color: marginColor }}>{data.gross_margin_avg}%</span>
          <span className="text-[10px] text-zinc-600">Meta: ≥ 25%</span>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Cashflow Estimado</span>
          <span className="font-bold text-4xl text-white mt-1 block">{fmtARS(data.estimated_cashflow)}</span>
          <span className="text-[10px] text-zinc-600">Proyección cierre de mes</span>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex-1 min-h-0 flex flex-col">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-2 shrink-0">
          Facturación vs Meta — Últimos 5 Meses (ARS M)
        </span>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={billingHistory} barGap={4}>
              <XAxis dataKey="label" tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`ARS ${v}M`, '']}
              />
              <Bar dataKey="target" fill="#27272a" radius={[4, 4, 0, 0]} name="Meta" />
              <Bar dataKey="billing" radius={[4, 4, 0, 0]} name="Facturado">
                {billingHistory.map((e, i) => (
                  <Cell key={`cell-${i}`} fill={e.billing >= e.target ? '#22c55e' : e.billing >= e.target * 0.8 ? '#f97316' : '#eab308'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Panel 3: HH ─────────────────────────────────────────────────────────────
function TVHH({ projects }: { projects: Project[] }) {
  const data = projects.map((p) => ({
    name: p.code,
    fullName: p.name,
    budgeted: p.budgeted_hh,
    consumed: p.consumed_hh,
    deviation: p.consumed_hh - p.budgeted_hh,
    pct: p.budgeted_hh > 0 ? Math.round((p.consumed_hh / p.budgeted_hh) * 100) : 0,
  }));
  const totalBudgeted = projects.reduce((s, p) => s + p.budgeted_hh, 0);
  const totalConsumed = projects.reduce((s, p) => s + p.consumed_hh, 0);
  const globalDev = totalConsumed - totalBudgeted;
  const globalDevPct = totalBudgeted > 0 ? ((totalConsumed / totalBudgeted) * 100 - 100).toFixed(1) : '0';

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">HH Presupuestadas</span>
          <div className="font-bold text-white text-3xl mt-1">{totalBudgeted.toLocaleString()} hs</div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">HH Consumidas</span>
          <div className="font-bold text-3xl mt-1" style={{ color: totalConsumed > totalBudgeted ? '#ef4444' : '#22c55e' }}>
            {totalConsumed.toLocaleString()} hs
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Desvío Global</span>
          <div className="flex items-center gap-2 mt-1">
            {globalDev > 0 ? <TrendingUp size={20} className="text-red-400" /> : globalDev < 0 ? <TrendingDown size={20} className="text-green-400" /> : <Minus size={20} className="text-zinc-500" />}
            <span className="font-bold text-3xl" style={{ color: globalDev > 0 ? '#ef4444' : '#22c55e' }}>
              {globalDev > 0 ? '+' : ''}{globalDev.toLocaleString()} hs
            </span>
            <span className="text-sm text-zinc-500">({globalDevPct}%)</span>
          </div>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col min-h-0">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-2 shrink-0">
            HH Real vs Presupuestadas por Obra
          </span>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, n: any) => [`${Number(v).toLocaleString()} hs`, n === 'budgeted' ? 'Presupuestadas' : 'Consumidas']}
                  labelFormatter={(label) => data.find((d) => d.name === label)?.fullName ?? label}
                />
                <ReferenceLine y={0} stroke="#3f3f46" />
                <Bar dataKey="budgeted" fill="#3f3f46" radius={[3, 3, 0, 0]} name="budgeted" />
                <Bar dataKey="consumed" radius={[3, 3, 0, 0]} name="consumed">
                  {data.map((e, i) => <Cell key={`c-${i}`} fill={e.consumed > e.budgeted ? '#ef4444' : '#f97316'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col min-h-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-zinc-500 font-medium uppercase tracking-wider">Obra</th>
                <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Presup.</th>
                <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Consumido</th>
                <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">% Uso</th>
                <th className="text-right p-3 text-zinc-500 font-medium uppercase tracking-wider">Desvío</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.name} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? '' : 'bg-zinc-950/30'}`}>
                  <td className="p-2 text-zinc-300 font-mono text-[10px]">{row.name}</td>
                  <td className="p-2 text-right text-zinc-400">{row.budgeted.toLocaleString()}</td>
                  <td className="p-2 text-right font-semibold" style={{ color: row.consumed > row.budgeted ? '#ef4444' : '#f4f4f5' }}>
                    {row.consumed.toLocaleString()}
                  </td>
                  <td className="p-2 text-right" style={{ color: row.pct > 100 ? '#ef4444' : row.pct > 85 ? '#eab308' : '#a1a1aa' }}>
                    {row.pct}%
                  </td>
                  <td className="p-2 text-right font-semibold" style={{ color: row.deviation > 0 ? '#ef4444' : '#22c55e' }}>
                    {row.deviation > 0 ? '+' : ''}{row.deviation.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Panel 4: RRHH / Crew ─────────────────────────────────────────────────────
const CERT_LABELS: Record<string, string> = {
  soldadura_3g: 'Sold. 3G', soldadura_6g: 'Sold. 6G',
  espacios_confinados: 'Esp. Conf.', altura: 'Altura',
  gruas: 'Grúas', izaje: 'Izaje', seguridad_industrial: 'Seguridad',
};

function TVCrew({ crews, employees }: { crews: Crew[]; employees: Employee[] }) {
  const today = new Date();
  const expiringSoon = employees.filter((e) =>
    e.certifications.some((c) => {
      if (!c.is_valid) return false;
      const d = Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / 86400000);
      return d <= 30 && d > 0;
    })
  );
  const expiredWorkers = employees.filter((e) => e.certifications.some((c) => !c.is_valid));
  const fieldCount = crews.filter((c) => c.project_id).reduce((s, c) => s + c.members_count, 0);
  const activeCount = employees.filter((e) => e.is_active).length;

  const certCount: Record<string, number> = {};
  employees.forEach((e) =>
    e.certifications.forEach((c) => {
      if (c.is_valid && c.type !== 'seguridad_industrial') {
        certCount[c.type] = (certCount[c.type] || 0) + 1;
      }
    })
  );

  return (
    <div className="h-full grid grid-cols-2 gap-3">
      {/* Left: KPIs + cuadrillas */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {[
            { label: 'Personal Activo',    value: activeCount,            sub: `de ${employees.length} totales`,                       cls: 'text-white' },
            { label: 'En Campo',           value: fieldCount,             sub: `en ${crews.filter((c) => c.project_id).length} cuadrillas`, cls: 'text-industrial-orange' },
            { label: 'Cert. por Vencer',   value: expiringSoon.length,    sub: 'próximos 30 días',                                     cls: expiringSoon.length  > 0 ? 'text-industrial-yellow' : 'text-industrial-green' },
            { label: 'Cert. Vencidas',     value: expiredWorkers.length,  sub: 'inhabilitados',                                        cls: expiredWorkers.length > 0 ? 'text-industrial-red'    : 'text-industrial-green' },
          ].map((k) => (
            <div key={k.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{k.label}</span>
              <span className={`font-bold text-3xl ${k.cls}`}>{k.value}</span>
              <span className="text-[10px] text-zinc-600">{k.sub}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="p-3 border-b border-zinc-800 shrink-0">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Estado de Cuadrillas</span>
          </div>
          <div className="divide-y divide-zinc-800/60 flex-1 overflow-hidden">
            {crews.map((crew) => (
              <div key={crew.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white truncate block">{crew.name}</span>
                  <span className="text-xs text-zinc-500">Capataz: {crew.leader_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-white">{crew.members_count}</span>
                  <span className="text-xs text-zinc-500">pers.</span>
                  {crew.project_id ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-industrial-orange/10 text-industrial-orange border border-industrial-orange/20 max-w-[140px] truncate">
                      {crew.project_name?.split(' ').slice(0, 3).join(' ')}…
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-industrial-green/10 text-industrial-green border border-industrial-green/20">
                      Disponible
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Certs + expiring */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 shrink-0">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-3">
            Especialidades (Certificaciones Activas)
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(certCount).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                <span className="text-sm font-bold text-white">{count}</span>
                <span className="text-xs text-zinc-400">{CERT_LABELS[type] ?? type}</span>
              </div>
            ))}
          </div>
        </div>

        {expiringSoon.length > 0 && (
          <div className="rounded-xl bg-industrial-yellow/5 border border-industrial-yellow/20 overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="p-3 border-b border-industrial-yellow/20 shrink-0 flex items-center gap-2">
              <AlertTriangle size={13} className="text-industrial-yellow" />
              <span className="text-xs font-semibold text-industrial-yellow uppercase tracking-wider">
                Certificaciones por Vencer (30 días)
              </span>
            </div>
            <div className="divide-y divide-yellow-900/20 flex-1 overflow-hidden">
              {expiringSoon.slice(0, 7).map((emp) => {
                const expCert = emp.certifications.find((c) => {
                  if (!c.is_valid) return false;
                  return Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / 86400000) <= 30;
                });
                const daysLeft = expCert
                  ? Math.ceil((new Date(expCert.expiry_date).getTime() - today.getTime()) / 86400000)
                  : 0;
                return (
                  <div key={emp.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-white">{emp.first_name} {emp.last_name}</span>
                      <p className="text-xs text-zinc-500">{expCert?.certification_name}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ color: daysLeft <= 7 ? '#ef4444' : '#eab308', background: daysLeft <= 7 ? '#ef44440f' : '#eab3080f' }}
                    >
                      {daysLeft}d restantes
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {expiredWorkers.length > 0 && (
          <div className="rounded-xl bg-industrial-red/5 border border-industrial-red/20 p-4 shrink-0">
            <span className="text-xs font-semibold text-industrial-red uppercase tracking-wider block mb-2">
              Empleados Inhabilitados
            </span>
            <div className="flex flex-col gap-1.5">
              {expiredWorkers.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{e.first_name} {e.last_name}</span>
                  <span className="text-industrial-red font-semibold">Cert. Vencida</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main War Room Page ───────────────────────────────────────────────────────
export default function WarRoomPage() {
  const projects  = useDataStore((s) => s.projects);
  const alerts    = useDataStore((s) => s.alerts);
  const crews     = useDataStore((s) => s.crews);
  const employees = useDataStore((s) => s.employees);
  const financials = useDataStore((s) => s.financials);

  const { setTvMode, tvRotationInterval, setTvRotationInterval, tvRotationPaused, setTvRotationPaused, setCurrentTvPanel } = useUIStore();
  const { currentTvPanel, toggleFullscreen } = useTVMode();
  const [showSettings, setShowSettings] = React.useState(false);
  const [localInterval, setLocalInterval] = React.useState(tvRotationInterval);

  useEffect(() => {
    setTvMode(true);
    return () => setTvMode(false);
  }, [setTvMode]);

  const criticalCount = alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
  const CurrentPanelIcon = PANELS[currentTvPanel]?.icon ?? Building2;

  return (
    <div className="tv-burn-in-protection flex flex-col h-screen w-full bg-zinc-950 overflow-hidden select-none">

      {/* ── Topbar ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png" alt="Imeca"
            className="h-8 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-lg font-bold text-white leading-none tracking-tight">
              Centro de Operaciones — War Room
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Montajes Imeca · Actualización en tiempo real</p>
          </div>
        </div>

        {/* Panel tabs */}
        <div className="flex items-center gap-2">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentTvPanel(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTvPanel === p.id ? 'bg-industrial-orange text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <p.icon size={12} />
              {p.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-industrial-red/10 border border-industrial-red/20">
              <span className="w-1.5 h-1.5 rounded-full bg-industrial-red animate-pulse" />
              <span className="text-xs font-bold text-industrial-red">
                {criticalCount} CRÍTICA{criticalCount > 1 ? 'S' : ''}
              </span>
            </div>
          )}
          <button onClick={() => setTvRotationPaused(!tvRotationPaused)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all" title={tvRotationPaused ? 'Reanudar rotación' : 'Pausar rotación'}>
            {tvRotationPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button onClick={() => setCurrentTvPanel((currentTvPanel - 1 + PANELS.length) % PANELS.length)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentTvPanel((currentTvPanel + 1) % PANELS.length)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
            <Settings size={16} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
            <Maximize2 size={16} />
          </button>
          <Link href="/dashboard" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
            <X size={16} />
          </Link>
        </div>
      </header>

      {/* ── Settings overlay ── */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-50 w-72 bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">Configuración TV</span>
            <button onClick={() => setShowSettings(false)}>
              <X size={14} className="text-zinc-500 hover:text-white" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Intervalo de Rotación: <strong className="text-white">{localInterval}s</strong>
              </label>
              <input
                type="range" min={5} max={120} step={5}
                value={localInterval}
                onChange={(e) => setLocalInterval(Number(e.target.value))}
                onMouseUp={() => setTvRotationInterval(localInterval)}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
                <span>5s</span><span>60s</span><span>120s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="pauseRotation" type="checkbox"
                checked={tvRotationPaused}
                onChange={(e) => setTvRotationPaused(e.target.checked)}
                className="accent-orange-500"
              />
              <label htmlFor="pauseRotation" className="text-sm text-zinc-300 cursor-pointer">
                Pantalla estática (sin rotación)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel dot indicators ── */}
      <div className="flex justify-center gap-2 py-2 shrink-0">
        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => setCurrentTvPanel(p.id)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentTvPanel === p.id ? 'w-8 bg-industrial-orange' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
            }`}
          />
        ))}
      </div>

      {/* ── Main panel content — fills remaining height, NO SCROLL ── */}
      <main className="flex-1 min-h-0 px-6 pb-4 flex flex-col overflow-hidden">
        {/* Panel label */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
            <CurrentPanelIcon size={20} className="text-industrial-orange" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {PANELS[currentTvPanel]?.label}
          </h2>
          {!tvRotationPaused && (
            <span className="ml-auto text-xs text-zinc-600">
              Próxima rotación en {tvRotationInterval}s
            </span>
          )}
        </div>

        {/* Panel — takes all remaining space, no overflow */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {currentTvPanel === 0 && <TVProjects projects={projects} />}
          {currentTvPanel === 1 && <TVAlerts alerts={alerts} />}
          {currentTvPanel === 2 && <TVFinancial data={financials} />}
          {currentTvPanel === 3 && <TVHH projects={projects} />}
          {currentTvPanel === 4 && <TVCrew crews={crews} employees={employees} />}
        </div>
      </main>
    </div>
  );
}
