'use client';
import React, { useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useRealtime } from '../../hooks/useRealtime';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useRealtime();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
