'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabase';

export const Topbar: React.FC = () => {
  const alerts = useDataStore((s) => s.alerts);
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = mounted && now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const dateStr = mounted && now ? now.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      {/* Left: Date & time */}
      <div className="flex items-center gap-3">
        {dateStr && <span className="text-xs text-zinc-500 capitalize">{dateStr}</span>}
        <span className="text-xs font-mono font-semibold text-zinc-300">{timeStr}</span>
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs">
          {isSupabaseConfigured ? (
            <>
              <Wifi size={13} className="text-industrial-green" />
              <span className="text-zinc-500">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-industrial-yellow" />
              <span className="text-zinc-500">Modo Demo</span>
            </>
          )}
        </div>

        {/* Refresh indicator */}
        <div className="flex items-center gap-1 text-xs text-zinc-600">
          <RefreshCw size={11} />
          <span>Live</span>
        </div>

        {/* Alerts Bell */}
        <div className="relative">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white">
            <Bell size={13} />
            {activeAlerts.length > 0 && (
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  criticalCount > 0 ? 'text-industrial-red' : 'text-industrial-yellow'
                }`}
              >
                {activeAlerts.length}
              </span>
            )}
          </button>
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-industrial-red animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
};
