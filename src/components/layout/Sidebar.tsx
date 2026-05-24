'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '../../stores/uiStore';
import {
  LayoutDashboard, Building2, AlertTriangle, DollarSign,
  Users, BarChart3, Wrench, Tv2, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Vista General', icon: LayoutDashboard },
  { href: '/dashboard/obras', label: 'Obras', icon: Building2 },
  { href: '/dashboard/alertas', label: 'Alertas', icon: AlertTriangle },
  { href: '/dashboard/finanzas', label: 'Finanzas', icon: DollarSign },
  { href: '/dashboard/rrhh', label: 'RRHH', icon: Users },
  { href: '/dashboard/horas-hombre', label: 'Horas Hombre', icon: BarChart3 },
  { href: '/dashboard/equipos', label: 'Equipos', icon: Wrench },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const pathname = usePathname();

  return (
    <aside
      className={`relative flex flex-col shrink-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-56' : 'w-14'
      }`}
    >
      {/* Logo area */}
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-zinc-800 overflow-hidden`}>
        <div className="shrink-0 w-8 h-8 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png"
            alt="Imeca"
            className="w-8 h-8 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white tracking-tight leading-none truncate">
              Montajes Imeca
            </span>
            <span className="text-[10px] text-zinc-500 leading-none mt-0.5 truncate">
              Centro de Operaciones
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={!sidebarOpen ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-industrial-orange/10 text-industrial-orange'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
              {isActive && sidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-industrial-orange" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* TV Mode Link */}
      <div className="border-t border-zinc-800 py-2 px-2">
        <Link
          href="/war-room"
          title={!sidebarOpen ? 'Modo TV' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:text-industrial-orange hover:bg-industrial-orange/5 transition-all"
        >
          <Tv2 size={18} className="shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Modo TV</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all z-10"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  );
};
