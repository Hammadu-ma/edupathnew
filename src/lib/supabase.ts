import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createMockClient } from './mockSupabase';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when no Supabase credentials are set: the app runs on a local, hardcoded demo backend. */
export const isMock = !(url && key);

export const supabase = (isMock
  ? createMockClient()
  : createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
) as unknown as SupabaseClient;
