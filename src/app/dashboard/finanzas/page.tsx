'use client';
import { useDataStore } from '../../../stores/dataStore';
import { FinancialPulse } from '../../../components/dashboard/FinancialPulse';
import { DollarSign } from 'lucide-react';

export default function FinanzasPage() {
  const financials = useDataStore((s) => s.financials);
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-industrial-orange/10 border border-industrial-orange/20">
          <DollarSign size={20} className="text-industrial-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pulso Financiero</h1>
          <p className="text-sm text-zinc-500">Márgenes, facturación y flujo de caja proyectado</p>
        </div>
      </div>
      <FinancialPulse data={financials} />
    </div>
  );
}
