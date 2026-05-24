import React from 'react';
import { Project, ProjectStatus } from '../../types';
import { Briefcase, User, Calendar, ShieldAlert, DollarSign, Activity } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  tvSize?: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, tvSize = false }) => {
  const getStatusBadge = (status: ProjectStatus) => {
    const base = "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 w-fit";
    switch (status) {
      case 'en_plazo':
        return `${base} bg-industrial-green/10 text-industrial-green border border-industrial-green/20`;
      case 'en_riesgo':
        return `${base} bg-industrial-yellow/10 text-industrial-yellow border border-industrial-yellow/20`;
      case 'atrasada':
        return `${base} bg-industrial-red/10 text-industrial-red border border-industrial-red/20`;
      case 'por_cerrar':
        return `${base} bg-industrial-blue/10 text-industrial-blue border border-industrial-blue/20`;
      case 'detenida':
      default:
        return `${base} bg-zinc-800 text-zinc-400 border border-zinc-700`;
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case 'en_plazo': return 'En Plazo';
      case 'en_riesgo': return 'En Riesgo';
      case 'atrasada': return 'Atrasada';
      case 'por_cerrar': return 'Por Cerrar';
      case 'detenida': return 'Detenida';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => {
        // Calculate progress percentage based on HH consumed vs budgeted
        const progressPercentage = Math.min(100, Math.round((project.consumed_hh / project.budgeted_hh) * 100));
        const hhOverrun = project.consumed_hh > project.budgeted_hh;
        const hhDeviation = project.consumed_hh - project.budgeted_hh;

        return (
          <div
            key={project.id}
            className={`rounded-xl bg-industrial-card p-5 border border-industrial-border transition-all duration-200 hover:border-zinc-700 shadow-md ${
              project.status === 'atrasada' ? 'border-l-4 border-l-industrial-red' : 
              project.status === 'en_riesgo' ? 'border-l-4 border-l-industrial-yellow' : 
              project.status === 'detenida' ? 'border-l-4 border-l-zinc-500' : ''
            }`}
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-mono text-industrial-muted uppercase tracking-widest">{project.code}</span>
                <h3 className={`font-semibold text-white tracking-tight ${tvSize ? 'text-2xl' : 'text-lg'}`}>
                  {project.name}
                </h3>
                <div className="mt-1 flex items-center gap-4 text-xs text-industrial-muted">
                  <span className="flex items-center gap-1">
                    <Briefcase size={13} />
                    {project.client_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={13} />
                    PM: {project.manager_name}
                  </span>
                </div>
              </div>
              <span className={getStatusBadge(project.status)}>{getStatusText(project.status)}</span>
            </div>

            {/* Metrics Grid */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Progress & HH */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between text-xs text-industrial-muted font-medium mb-1">
                  <span>Horas Hombre (HH)</span>
                  <span className={hhOverrun ? 'text-industrial-red font-semibold' : 'text-zinc-300'}>
                    {project.consumed_hh.toLocaleString()} / {project.budgeted_hh.toLocaleString()} hs
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      hhOverrun ? 'bg-industrial-red' : project.status === 'en_riesgo' ? 'bg-industrial-yellow' : 'bg-industrial-green'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {hhOverrun && (
                  <span className="mt-1 text-[10px] text-industrial-red font-semibold">
                    Desvío: +{hhDeviation.toLocaleString()} HH
                  </span>
                )}
              </div>

              {/* End Date */}
              <div className="flex flex-col justify-center border-l border-industrial-border pl-4 md:border-l">
                <span className="text-xs text-industrial-muted font-medium">Fin Contractual vs. Estimado</span>
                <div className="mt-1 flex items-center gap-1.5 text-zinc-300 text-sm font-semibold">
                  <Calendar size={14} className="text-industrial-muted" />
                  <span>{project.end_date_contractual}</span>
                  {project.end_date_estimated !== project.end_date_contractual && (
                    <span className="text-xs text-industrial-red font-medium">
                      ({project.end_date_estimated})
                    </span>
                  )}
                </div>
              </div>

              {/* Margins & Costs */}
              <div className="flex flex-col justify-center border-l border-industrial-border pl-4 md:border-l">
                <span className="text-xs text-industrial-muted font-medium">Margen Presup. vs Real</span>
                <div className="mt-1 flex items-center gap-1.5 text-zinc-300 text-sm font-semibold">
                  <DollarSign size={14} className="text-industrial-muted" />
                  <span>{project.margin_estimated}% / </span>
                  <span className={project.real_margin < project.margin_estimated ? 'text-industrial-red' : 'text-industrial-green'}>
                    {project.real_margin}%
                  </span>
                </div>
              </div>

              {/* Active Risks */}
              <div className="flex flex-col justify-center border-l border-industrial-border pl-4 md:border-l">
                <span className="text-xs text-industrial-muted font-medium">Riesgos Contractuales / Multas</span>
                <div className="mt-1 flex flex-col gap-0.5">
                  {project.potential_penalties > 0 ? (
                    <span className="text-xs text-industrial-red font-semibold flex items-center gap-1">
                      <ShieldAlert size={13} />
                      Multa Est: ARS {project.potential_penalties.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-industrial-green font-medium flex items-center gap-1">
                      <Activity size={13} />
                      Sin penalidades activas
                    </span>
                  )}
                  {project.risks_active.length > 0 && (
                    <span className="text-[10px] text-industrial-yellow font-medium truncate max-w-[200px]" title={project.risks_active.join(', ')}>
                      Riesgo: {project.risks_active[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
