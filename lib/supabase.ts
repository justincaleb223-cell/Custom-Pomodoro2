
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These will be automatically populated when you connect Supabase in Natively
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types
export interface Task {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string;
  duration_minutes: number;
  completed_at: string;
}

export interface TimerState {
  user_id: string;
  task_id?: string;
  mode: 'focus' | 'break';
  remaining_seconds: number;
  is_running: boolean;
  started_at?: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  focus_duration: number;
  break_duration: number;
  updated_at: string;
}
