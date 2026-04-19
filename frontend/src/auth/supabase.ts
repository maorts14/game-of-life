import { createClient } from "@supabase/supabase-js";
import { frontendEnv } from "../shared/env";

export const supabase = frontendEnv.isSupabaseConfigured
  ? createClient(frontendEnv.supabaseUrl, frontendEnv.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
