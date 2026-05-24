import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Graceful check for environment variables
export const isSupabaseConfigured = 
  supabaseUrl.length > 0 && 
  supabaseUrl !== 'your-supabase-url' && 
  supabaseAnonKey.length > 0 && 
  supabaseAnonKey !== 'your-supabase-anon-key';

// Instantiate Supabase client if configured, otherwise provide mock object or safe fallback client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock database helper functions to simulate latency & database connectivity
export const mockService = {
  fetchProjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },
  
  fetchAlerts: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  }
};
