import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useDataStore } from '../stores/dataStore';
import { Alert, ProjectStatus } from '../types';

export const useRealtime = () => {
  const triggerUpdate = useDataStore((state) => state.triggerRealtimeUpdate);
  const projects = useDataStore((state) => state.projects);
  const alerts = useDataStore((state) => state.alerts);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      // Subscribe to alerts and projects tables
      const channel = client
        .channel('imeca_realtime_dashboard')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'alerts' },
          (payload) => {
            const { table, ...rest } = payload;
            triggerUpdate({ table: 'alerts', ...rest });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects' },
          (payload) => {
            const { table, ...rest } = payload;
            triggerUpdate({ table: 'projects', ...rest });
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } else {
      // DEMO MODE: Simulate background real-time updates every 45 seconds
      const interval = setInterval(() => {
        const randomNum = Math.random();
        
        if (randomNum < 0.4) {
          // A: Simulate project progress increment
          const randomProj = projects[Math.floor(Math.random() * projects.length)];
          const progressStep = Math.min(100, Math.floor(Math.random() * 5) + 1);
          
          console.log(`[Realtime Demo] Progreso en Obra ${randomProj.name} incrementado.`);
          useDataStore.getState().updateProjectProgress(
            randomProj.id, 
            Math.min(100, Math.round((randomProj.consumed_hh / randomProj.projected_hh * 100) + progressStep)),
            'Actualización automática de avance diario por sensor de cuadrilla'
          );
        } else if (randomNum < 0.7) {
          // B: Simulate new low-priority weather alert
          const newAlert: Alert = {
            id: `alt-demo-${Date.now()}`,
            project_id: 'prj-1',
            project_name: 'Ampliación Compresión El Zaimán - Techint',
            type: 'extreme_weather',
            severity: 'info',
            priority: 'low',
            message: `Alerta Clima: Lloviznas persistentes reportadas en zona El Zaimán. Humedad 94%. Labores de soldadura a resguardo.`,
            suggested_action: 'Cubrir equipamiento y reanudar tareas en zonas techadas.',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('[Realtime Demo] Nueva alerta climatológica recibida.');
          triggerUpdate({ table: 'alerts', eventType: 'INSERT', new: newAlert });
        } else {
          // C: Shift project status slightly
          const randomProj = projects[Math.floor(Math.random() * projects.length)];
          const statuses: ProjectStatus[] = ['en_plazo', 'en_riesgo'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          if (randomProj.status !== 'detenida' && randomProj.status !== 'atrasada') {
            useDataStore.getState().updateProjectStatus(randomProj.id, newStatus);
            console.log(`[Realtime Demo] Obra ${randomProj.name} cambió su estado a: ${newStatus}`);
          }
        }
      }, 45000);

      return () => clearInterval(interval);
    }
  }, [projects, alerts, triggerUpdate]);
};
