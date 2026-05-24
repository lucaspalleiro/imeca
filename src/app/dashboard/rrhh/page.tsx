'use client';
import { useDataStore } from '../../../stores/dataStore';
import { CrewGrid } from '../../../components/dashboard/CrewGrid';
import { Users } from 'lucide-react';

export default function RRHHPage() {
  const crews = useDataStore((s) => s.crews);
  const employees = useDataStore((s) => s.employees);
  const activeEmployees = employees.filter((e) => e.is_active);
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
          <Users size={20} className="text-industrial-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recursos Humanos y Cuadrillas</h1>
          <p className="text-sm text-zinc-500">{activeEmployees.length} empleados activos en {crews.length} cuadrillas</p>
        </div>
      </div>
      <CrewGrid crews={crews} employees={employees} />
    </div>
  );
}
