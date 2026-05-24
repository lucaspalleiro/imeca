'use client';
import React from 'react';
import { useDataStore } from '../../../stores/dataStore';
import { Wrench, MapPin, Calendar, CreditCard, ShieldAlert } from 'lucide-react';

export default function EquiposPage() {
  const equipment = useDataStore((s) => s.equipment);

  // Quick stats
  const total = equipment.length;
  const enObra = equipment.filter((e) => e.status === 'en_obra').length;
  const mantenimiento = equipment.filter((e) => e.status === 'mantenimiento').length;
  const disponible = equipment.filter((e) => e.status === 'disponible').length;
  const alquilado = equipment.filter((e) => e.is_rented).length;
  const monthlyRentalCost = equipment.reduce((s, e) => s + e.rental_cost_monthly, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponible':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">Disponible</span>;
      case 'en_obra':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">En Obra</span>;
      case 'mantenimiento':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Mantenimiento</span>;
      case 'fuera_servicio':
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Fuera de Servicio</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
          <Wrench size={20} className="text-industrial-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Control de Equipos y Maquinaria</h1>
          <p className="text-sm text-zinc-500">Monitoreo de equipos críticos, estado operativo y mantenimiento</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Flota Total</span>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
          <span className="text-[10px] text-zinc-600 block mt-0.5">Equipamiento registrado</span>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">En Operación</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{enObra}</p>
          <span className="text-[10px] text-zinc-600 block mt-0.5">{Math.round((enObra / total) * 100)}% de utilización</span>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">En Taller</span>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{mantenimiento}</p>
          <span className="text-[10px] text-zinc-600 block mt-0.5">Servicio técnico programado</span>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Disponibles</span>
          <p className="text-2xl font-bold text-green-400 mt-1">{disponible}</p>
          <span className="text-[10px] text-zinc-600 block mt-0.5">Listos para despacho</span>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 col-span-2 md:col-span-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Alquileres</span>
          <p className="text-2xl font-bold text-orange-400 mt-1">{alquilado}</p>
          <span className="text-[10px] text-zinc-600 block mt-0.5">ARS {(monthlyRentalCost / 1000000).toFixed(1)}M mensuales</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/20">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Inventario de Equipos Críticos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/10 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="p-4">Código</th>
                <th className="p-4">Equipo / Modelo</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Ubicación / Obra</th>
                <th className="p-4">Último Mantenimiento</th>
                <th className="p-4">Próximo Mantenimiento</th>
                <th className="p-4 text-right">Régimen</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item, index) => {
                const isOverdue = item.next_maintenance_date && new Date(item.next_maintenance_date) < new Date();
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-all ${
                      index % 2 === 0 ? '' : 'bg-zinc-950/10'
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-zinc-400">{item.code}</td>
                    <td className="p-4">
                      <div className="font-semibold text-zinc-200">{item.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {item.brand} {item.model}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(item.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <MapPin size={12} className="text-zinc-500 shrink-0" />
                        <span>{item.location || 'No asignado'}</span>
                      </div>
                      {item.project_name && (
                        <div className="text-[10px] text-zinc-500 ml-4 mt-0.5 truncate max-w-[200px]" title={item.project_name}>
                          {item.project_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-zinc-400">
                      {item.last_maintenance_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-zinc-600 shrink-0" />
                          <span>{item.last_maintenance_date}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">
                      {item.next_maintenance_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-zinc-600 shrink-0" />
                          <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
                            {item.next_maintenance_date}
                          </span>
                          {isOverdue && <ShieldAlert size={12} className="text-red-400 shrink-0 animate-pulse" />}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {item.is_rented ? (
                        <div className="flex items-center justify-end gap-1.5 text-orange-400 font-semibold">
                          <CreditCard size={12} />
                          <span>Alquilado</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-medium">Propio</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
