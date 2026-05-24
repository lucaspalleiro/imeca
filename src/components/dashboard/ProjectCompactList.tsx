import React from 'react';
import { Project, ProjectStatus } from '../../types';
import { Building2 } from 'lucide-react';

interface ProjectCompactListProps {
  projects: Project[];
}

const STATUS_DOT: Record<ProjectStatus, string> = {
  en_plazo:  'bg-industrial-green',
  en_riesgo: 'bg-industrial-yellow',
  atrasada:  'bg-industrial-red',
  por_cerrar:'bg-industrial-blue',
  detenida:  'bg-zinc-500',
};

const STATUS_BADGE: Record<ProjectStatus, { label: string; className: string }> = {
  en_plazo:  { label: 'En plazo',  className: 'bg-industrial-green/10  text-industrial-green  border border-industrial-green/20'  },
  en_riesgo: { label: 'En riesgo', className: 'bg-industrial-yellow/10 text-industrial-yellow border border-industrial-yellow/20' },
  atrasada:  { label: 'Atrasada',  className: 'bg-industrial-red/10    text-industrial-red    border border-industrial-red/20'    },
  por_cerrar:{ label: 'Por cerrar',className: 'bg-industrial-blue/10   text-industrial-blue   border border-industrial-blue/20'   },
  detenida:  { label: 'Detenida',  className: 'bg-zinc-800 text-zinc-400 border border-zinc-700'                                   },
};

const PROGRESS_COLOR: Record<ProjectStatus, string> = {
  en_plazo:  'bg-industrial-green',
  en_riesgo: 'bg-industrial-yellow',
  atrasada:  'bg-industrial-red',
  por_cerrar:'bg-industrial-green',
  detenida:  'bg-zinc-500',
};

export const ProjectCompactList: React.FC<ProjectCompactListProps> = ({ projects }) => {
  return (
    <div className="rounded-xl bg-industrial-card border border-industrial-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-industrial-border bg-zinc-900/40">
        <Building2 size={14} className="text-industrial-orange" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
          Estado de Obras
        </span>
        <span className="ml-auto text-xs text-zinc-600">{projects.length} obras</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-industrial-border">
        {projects.map((p) => {
          const pct = Math.min(100, Math.round((p.consumed_hh / p.budgeted_hh) * 100));
          const badge = STATUS_BADGE[p.status];

          return (
            <div
              key={p.id}
              className="px-4 py-3 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors"
            >
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[p.status]}`} />

              {/* Name + client/PM */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{p.name}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {p.client_name} · Jefe: {p.manager_name}
                </p>
              </div>

              {/* Progress bar + % */}
              <div className="flex items-center gap-2 shrink-0 w-28">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${PROGRESS_COLOR[p.status]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-300 w-8 text-right">
                  {pct}%
                </span>
              </div>

              {/* Status badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
