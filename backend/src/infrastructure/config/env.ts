import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "integration", "production"]).default("local"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  COOKIE_SECRET: z.string().min(16),
  SESSION_ENCRYPTION_KEY: z.string().min(16),
});

export type AppEnv = z.infer<typeof envSchema> & {
  corsOrigins: string[];
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.parse(source);

  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
