'use client';
import { useDataStore } from '../../../stores/dataStore';
import { HHTrends } from '../../../components/dashboard/HHTrends';
import { BarChart3 } from 'lucide-react';

export default function HorasHombrePage() {
  const projects = useDataStore((s) => s.projects);
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
          <BarChart3 size={20} className="text-industrial-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Control de Horas Hombre</h1>
          <p className="text-sm text-zinc-500">Comparativa de HH presupuestadas vs consumidas y proyección de desvíos</p>
        </div>
      </div>
      <HHTrends projects={projects} />
    </div>
  );
}
