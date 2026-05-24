'use client';
import React from 'react';
import { useDataStore } from '../../stores/dataStore';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { ProjectCompactList } from '../../components/dashboard/ProjectCompactList';
import { AlertsPanel } from '../../components/dashboard/AlertsPanel';
import { FinancialPulse } from '../../components/dashboard/FinancialPulse';
import { HHTrends } from '../../components/dashboard/HHTrends';
import { CrewGrid } from '../../components/dashboard/CrewGrid';
import {
  Building2, Users, DollarSign, Clock,
  AlertTriangle, TrendingUp, ShieldAlert, CheckCircle
} from 'lucide-react';

export default function DashboardPage() {
  const projects = useDataStore((s) => s.projects);
  const employees = useDataStore((s) => s.employees);
  const alerts = useDataStore((s) => s.alerts);
  const crews = useDataStore((s) => s.crews);
  const financials = useDataStore((s) => s.financials);

  // Derived metrics
  const activeProjects = projects.filter((p) => p.status !== 'detenida');
  const criticalProjects = projects.filter((p) => p.status === 'atrasada' || p.status === 'en_riesgo');
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
  const fieldWorkers = crews.filter((c) => c.project_id).reduce((s, c) => s + c.members_count, 0);

  const totalHHConsumed = projects.reduce((s, p) => s + p.consumed_hh, 0);
  const totalHHBudgeted = projects.reduce((s, p) => s + p.budgeted_hh, 0);
  const hhPct = Math.round((totalHHConsumed / totalHHBudgeted) * 100);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Centro de Decisiones
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Visión ejecutiva en tiempo real — {activeProjects.length} obras activas
          </p>
        </div>
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-industrial-red/10 border border-industrial-red/20">
            <ShieldAlert size={16} className="text-industrial-red animate-pulse" />
            <span className="text-sm font-semibold text-industrial-red">
              {criticalAlerts.length} alerta{criticalAlerts.length > 1 ? 's' : ''} crítica{criticalAlerts.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="Obras Activas"
          value={activeProjects.length}
          subtitle={`${criticalProjects.length} en riesgo o atrasadas`}
          status={criticalProjects.length > 0 ? 'warning' : 'success'}
          icon={<Building2 size={18} />}
        />
        <MetricCard
          title="Personal en Campo"
          value={fieldWorkers}
          subtitle={`${employees.filter((e) => e.is_active).length} empleados activos`}
          status="default"
          icon={<Users size={18} />}
        />
        <MetricCard
          title="HH Acumuladas"
          value={`${(totalHHConsumed / 1000).toFixed(1)}K`}
          subtitle={`${hhPct}% del presupuesto total`}
          status={hhPct > 95 ? 'critical' : hhPct > 85 ? 'warning' : 'default'}
          change={hhPct - 80}
          changeDirection={hhPct > 80 ? 'up' : 'down'}
          icon={<Clock size={18} />}
        />
        <MetricCard
          title="Alertas Activas"
          value={activeAlerts.length}
          subtitle={`${criticalAlerts.length} críticas sin resolver`}
          status={criticalAlerts.length > 0 ? 'critical' : activeAlerts.length > 0 ? 'warning' : 'success'}
          icon={<AlertTriangle size={18} />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left 2/3: Projects + HH */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Section: Estado de Obras — compact view */}
          <section>
            <ProjectCompactList projects={projects} />
          </section>

          {/* Section: HH */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-industrial-orange" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">
                Horas Hombre
              </h2>
            </div>
            <HHTrends projects={projects} />
          </section>
        </div>

        {/* Right 1/3: Alerts + Crews */}
        <div className="flex flex-col gap-6">
          {/* Section: Alertas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-industrial-orange" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">
                Motor de Alertas
              </h2>
            </div>
            <AlertsPanel alerts={alerts} />
          </section>

          {/* Section: Cuadrillas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-industrial-orange" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">
                RRHH y Cuadrillas
              </h2>
            </div>
            <CrewGrid crews={crews} employees={employees} />
          </section>
        </div>
      </div>

      {/* Bottom: Financials */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-industrial-orange" />
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">
            Pulso Financiero
          </h2>
        </div>
        <FinancialPulse data={financials} />
      </section>
    </div>
  );
}
