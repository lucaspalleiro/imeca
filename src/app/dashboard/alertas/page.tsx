'use client';
import { useDataStore } from '../../../stores/dataStore';
import { AlertsPanel } from '../../../components/dashboard/AlertsPanel';
import { AlertTriangle } from 'lucide-react';

export default function AlertasPage() {
  const alerts = useDataStore((s) => s.alerts);
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
          <AlertTriangle size={20} className="text-industrial-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Motor de Alertas</h1>
          <p className="text-sm text-zinc-500">{activeAlerts.length} alertas activas</p>
        </div>
      </div>
      <AlertsPanel alerts={alerts} />
    </div>
  );
}
