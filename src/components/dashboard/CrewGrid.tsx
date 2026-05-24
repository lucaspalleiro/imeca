'use client';
import React from 'react';
import { Crew, Employee } from '../../types';
import { Users, HardHat, Wrench, AlertTriangle } from 'lucide-react';

interface CrewGridProps {
  crews: Crew[];
  employees: Employee[];
  tvSize?: boolean;
}

const CERT_LABELS: Record<string, string> = {
  soldadura_3g: 'Sold. 3G',
  soldadura_6g: 'Sold. 6G',
  espacios_confinados: 'Esp. Conf.',
  altura: 'Altura',
  gruas: 'Grúas',
  izaje: 'Izaje',
  seguridad_industrial: 'Seguridad',
};

export const CrewGrid: React.FC<CrewGridProps> = ({ crews, employees, tvSize = false }) => {
  // Compute certification expiry warnings
  const today = new Date();
  const expiringSoon = employees.filter((e) =>
    e.certifications.some((c) => {
      if (!c.is_valid) return false;
      const exp = new Date(c.expiry_date);
      const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
      return daysLeft <= 30 && daysLeft > 0;
    })
  );
  const expiredWorkers = employees.filter((e) =>
    e.certifications.some((c) => !c.is_valid)
  );

  // Specialty breakdown
  const certCount: Record<string, number> = {};
  employees.forEach((e) =>
    e.certifications.forEach((c) => {
      if (c.is_valid && c.type !== 'seguridad_industrial') {
        certCount[c.type] = (certCount[c.type] || 0) + 1;
      }
    })
  );

  const assignedCount = employees.filter((e) =>
    crews.some((c) => c.project_id && c.leader_id === e.id)
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-zinc-500" />
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Personal Activo</span>
          </div>
          <span className={`font-bold text-white ${tvSize ? 'text-4xl' : 'text-3xl'}`}>
            {employees.filter((e) => e.is_active).length}
          </span>
          <p className="text-[10px] text-zinc-600 mt-0.5">de {employees.length} totales</p>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <HardHat size={14} className="text-zinc-500" />
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">En Campo</span>
          </div>
          <span className={`font-bold text-industrial-orange ${tvSize ? 'text-4xl' : 'text-3xl'}`}>
            {crews.filter((c) => c.project_id).reduce((s, c) => s + c.members_count, 0)}
          </span>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            en {crews.filter((c) => c.project_id).length} cuadrillas activas
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-industrial-yellow" />
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Cert. por Vencer</span>
          </div>
          <span
            className={`font-bold ${tvSize ? 'text-4xl' : 'text-3xl'}`}
            style={{ color: expiringSoon.length > 0 ? '#eab308' : '#22c55e' }}
          >
            {expiringSoon.length}
          </span>
          <p className="text-[10px] text-zinc-600 mt-0.5">en próximos 30 días</p>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-industrial-red" />
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Cert. Vencidas</span>
          </div>
          <span
            className={`font-bold ${tvSize ? 'text-4xl' : 'text-3xl'}`}
            style={{ color: expiredWorkers.length > 0 ? '#ef4444' : '#22c55e' }}
          >
            {expiredWorkers.length}
          </span>
          <p className="text-[10px] text-zinc-600 mt-0.5">empleados inhabilitados</p>
        </div>
      </div>

      {/* Cuadrillas */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Wrench size={14} className="text-industrial-orange" />
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            Estado de Cuadrillas
          </span>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {crews.map((crew) => (
            <div key={crew.id} className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
              <div className="flex flex-col min-w-0 flex-1 pr-2">
                <span className={`font-semibold text-white ${tvSize ? 'text-lg' : 'text-sm'}`}>
                  {crew.name}
                </span>
                <span className="text-xs text-zinc-500 mt-0.5">
                  Capataz: {crew.leader_name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Users size={12} />
                  <span className="font-semibold text-white">{crew.members_count}</span>
                  <span>pers.</span>
                </div>
                {crew.project_id ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-industrial-orange/10 text-industrial-orange border border-industrial-orange/20">
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

      {/* Specialty Breakdown */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block mb-3">
          Especialidades Habilitadas (Certificaciones Activas)
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(certCount).map(([type, count]) => (
            <div
              key={type}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700"
            >
              <span className="text-xs font-semibold text-white">{count}</span>
              <span className="text-xs text-zinc-400">{CERT_LABELS[type] ?? type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring Soon Table */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl bg-industrial-yellow/5 border border-industrial-yellow/20 overflow-hidden">
          <div className="p-3 border-b border-industrial-yellow/20 flex items-center gap-2">
            <AlertTriangle size={14} className="text-industrial-yellow" />
            <span className="text-xs font-semibold text-industrial-yellow uppercase tracking-wider">
              Certificaciones por Vencer (próx. 30 días)
            </span>
          </div>
          <div className="divide-y divide-yellow-900/20">
            {expiringSoon.slice(0, tvSize ? 4 : 8).map((emp) => {
              const expCert = emp.certifications.find((c) => {
                if (!c.is_valid) return false;
                const d = Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / 86400000);
                return d <= 30;
              });
              const daysLeft = expCert
                ? Math.ceil((new Date(expCert.expiry_date).getTime() - today.getTime()) / 86400000)
                : 0;
              return (
                <div key={emp.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white">
                      {emp.first_name} {emp.last_name}
                    </span>
                    <p className="text-xs text-zinc-500">{expCert?.certification_name}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      color: daysLeft <= 7 ? '#ef4444' : '#eab308',
                      background: daysLeft <= 7 ? '#ef44440f' : '#eab3080f',
                    }}
                  >
                    {daysLeft}d restantes
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
