import { createClient } from "@supabase/supabase-js";
import type { AppEnv } from "../../config/env.js";

export class SupabaseClientFactory {
  constructor(private readonly env: AppEnv) {}

  createAuthClient() {
    return createClient(this.env.SUPABASE_URL, this.env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  createUserClient(accessToken: string) {
    return createClient(this.env.SUPABASE_URL, this.env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
}
