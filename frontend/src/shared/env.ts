const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const frontendEnv = {
  apiBaseUrl: rawApiBaseUrl.replace(/\/$/, ""),
  supabaseUrl: rawSupabaseUrl.replace(/\/$/, ""),
  supabaseAnonKey: rawSupabaseAnonKey,
  isSupabaseConfigured: rawSupabaseUrl.length > 0 && rawSupabaseAnonKey.length > 0,
  isApiConfigured: rawApiBaseUrl.length > 0,
};
