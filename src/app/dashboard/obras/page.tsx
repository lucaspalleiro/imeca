'use client';
import { useDataStore } from '../../../stores/dataStore';
import { ProjectList } from '../../../components/dashboard/ProjectList';
import { Building2 } from 'lucide-react';

export default function ObrasPage() {
  const projects = useDataStore((s) => s.projects);
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
          <Building2 size={20} className="text-industrial-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Estado de Obras</h1>
          <p className="text-sm text-zinc-500">{projects.length} obras registradas</p>
        </div>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
