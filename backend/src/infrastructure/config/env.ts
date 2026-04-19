import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "integration", "production"]).default("local"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  JWT_AUDIENCE: z.string().default("authenticated"),
  JWT_ISSUER: z.string().optional(),
});

export interface AppEnv {
  nodeEnv: "development" | "test" | "production";
  appEnv: "local" | "integration" | "production";
  port: number;
  apiHost: string;
  corsOrigins: string[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  jwtAudience: string;
  jwtIssuer: string;
  supabaseJwksUrl: string;
}

let cachedEnv: AppEnv | null = null;
let dotenvLoaded = false;

function loadEnvFiles() {
  if (dotenvLoaded) {
    return;
  }

  const cwd = process.cwd();
  const appEnv = process.env.APP_ENV ?? "local";
  const candidateFiles = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, `.env.${appEnv}`),
  ];

  for (const filePath of candidateFiles) {
    if (existsSync(filePath)) {
      const fileContents = readFileSync(filePath, "utf8");
      const lines = fileContents.split(/\r?\n/);

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmed.indexOf("=");

        if (separatorIndex <= 0) {
          continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const rawValue = trimmed.slice(separatorIndex + 1).trim();
        const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

        if (!(key in process.env)) {
          process.env[key] = normalizedValue;
        }
      }
    }
  }

  dotenvLoaded = true;
}

export function loadEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  loadEnvFiles();
  const parsed = envSchema.parse(process.env);
  const normalizedSupabaseUrl = parsed.SUPABASE_URL.replace(/\/$/, "");

  cachedEnv = {
    nodeEnv: parsed.NODE_ENV,
    appEnv: parsed.APP_ENV,
    port: parsed.PORT,
    apiHost: parsed.API_HOST,
    corsOrigins: parsed.CORS_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean),
    supabaseUrl: normalizedSupabaseUrl,
    supabaseAnonKey: parsed.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    jwtAudience: parsed.JWT_AUDIENCE,
    jwtIssuer: parsed.JWT_ISSUER ?? `${normalizedSupabaseUrl}/auth/v1`,
    supabaseJwksUrl: `${normalizedSupabaseUrl}/auth/v1/.well-known/jwks.json`,
  };

  return cachedEnv;
}
