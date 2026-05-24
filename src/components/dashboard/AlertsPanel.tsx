/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Alert, AlertSeverity } from '../../types';
import { useDataStore } from '../../stores/dataStore';
import { AlertTriangle, ShieldCheck, Clock, ShieldAlert, CheckCircle, UserCheck } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  tvSize?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, tvSize = false }) => {
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const acknowledgeAlert = useDataStore((state) => state.acknowledgeAlert);
  const resolveAlert = useDataStore((state) => state.resolveAlert);

  // Mock employee ID for actions
  const mockUserSessionEmployeeId = 'emp-exec-2'; // Lucas Imeca (Director)

  const filteredAlerts = alerts
    .filter((a) => a.status !== 'resolved')
    .filter((a) => (filter === 'all' ? true : a.severity === filter));

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-industrial-red/5',
          border: 'border-l-4 border-l-industrial-red border-t border-r border-b border-industrial-border',
          text: 'text-industrial-red',
          icon: <ShieldAlert className="text-industrial-red shrink-0" size={tvSize ? 24 : 18} />
        };
      case 'warning':
        return {
          bg: 'bg-industrial-yellow/5',
          border: 'border-l-4 border-l-industrial-yellow border-t border-r border-b border-industrial-border',
          text: 'text-industrial-yellow',
          icon: <AlertTriangle className="text-industrial-yellow shrink-0" size={tvSize ? 24 : 18} />
        };
      case 'info':
      default:
        return {
          bg: 'bg-industrial-blue/5',
          border: 'border-l-4 border-l-industrial-blue border-t border-r border-b border-industrial-border',
          text: 'text-industrial-blue',
          icon: <ShieldCheck className="text-industrial-blue shrink-0" size={tvSize ? 24 : 18} />
        };
    }
  };

  const getFormatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (!mounted) {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${hours}:${minutes} - ${day}/${month}`;
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters (Hide in TV Mode to avoid clutter) */}
      {!tvSize && (
        <div className="flex gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-industrial-border w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-industrial-orange text-white' : 'text-industrial-muted hover:text-white'
            }`}
          >
            Todas ({alerts.filter((a) => a.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              filter === 'critical' ? 'bg-industrial-red text-white' : 'text-industrial-muted hover:text-white'
            }`}
          >
            Críticas ({alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              filter === 'warning' ? 'bg-industrial-yellow text-zinc-950' : 'text-industrial-muted hover:text-white'
            }`}
          >
            Advertencias ({alerts.filter((a) => a.severity === 'warning' && a.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              filter === 'info' ? 'bg-industrial-blue text-white' : 'text-industrial-muted hover:text-white'
            }`}
          >
            Informativas ({alerts.filter((a) => a.severity === 'info' && a.status !== 'resolved').length})
          </button>
        </div>
      )}

      {/* Alerts List */}
      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-industrial-muted border border-dashed border-industrial-border rounded-xl">
            No hay alertas activas en esta categoría.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);

            return (
              <div
                key={alert.id}
                className={`rounded-xl p-4 transition-all duration-200 shadow-md ${styles.bg} ${styles.border}`}
              >
                {/* Alert Title & Severity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {styles.icon}
                    <div className="flex flex-col">
                      <span className={`font-semibold text-white tracking-tight ${tvSize ? 'text-xl' : 'text-sm'}`}>
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </span>
                      {alert.project_name && (
                        <span className="text-xs text-industrial-muted font-medium">
                          Obra: {alert.project_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-industrial-muted">
                    <Clock size={12} />
                    <span suppressHydrationWarning>{getFormatTime(alert.created_at)}</span>
                  </div>
                </div>

                {/* Message Body */}
                <p className={`mt-2.5 text-zinc-300 ${tvSize ? 'text-lg leading-relaxed' : 'text-xs leading-normal'}`}>
                  {alert.message}
                </p>

                {/* Suggested Action */}
                {alert.suggested_action && (
                  <div className="mt-3 bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-bold text-industrial-orange tracking-widest">
                      Acción Recomendada
                    </span>
                    <p className={`mt-0.5 text-zinc-400 ${tvSize ? 'text-base' : 'text-xs'}`}>
                      {alert.suggested_action}
                    </p>
                  </div>
                )}

                {/* Acknowledge / Resolution Actions */}
                {!tvSize && (
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-industrial-border/60 pt-3">
                    <div className="flex items-center gap-2">
                      {alert.status === 'acknowledged' ? (
                        <span className="flex items-center gap-1 text-[10px] text-industrial-yellow bg-industrial-yellow/10 px-2 py-0.5 rounded border border-industrial-yellow/20">
                          <UserCheck size={11} />
                          En Proceso por: {alert.assignee_name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-industrial-muted uppercase font-semibold">
                          Estado: Activo - Sin asignar
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {alert.status !== 'acknowledged' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id, mockUserSessionEmployeeId, 'Leído desde dashboard ejecutivo.')}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all"
                        >
                          Atender
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id, mockUserSessionEmployeeId, 'Resuelto e inspeccionado.')}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-industrial-green/10 hover:bg-industrial-green/20 text-industrial-green border border-industrial-green/30 transition-all"
                      >
                        <CheckCircle size={12} />
                        Resolver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
