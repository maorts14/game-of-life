import type {
  AuthService,
  AuthSession,
  AuthUser,
  SignUpResult,
} from "../../../domain/auth/AuthService.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { SupabaseClientFactory } from "../../db/supabase/SupabaseClientFactory.js";

function mapAuthUser(user: { id: string; email?: string | null }): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

function mapSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
  user: { id: string; email?: string | null };
}): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
    user: mapAuthUser(session.user),
  };
}

export class SupabaseAuthAdapter implements AuthService {
  constructor(private readonly clientFactory: SupabaseClientFactory) {}

  async signUp(email: string, password: string): Promise<SignUpResult> {
    const client = this.clientFactory.createAuthClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new AppError(400, "AUTH_SIGN_UP_FAILED", error.message);
    }

    return {
      user: data.user ? mapAuthUser(data.user) : null,
      session: data.session ? mapSession(data.session) : null,
      requiresEmailConfirmation: data.session === null,
    };
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const client = this.clientFactory.createAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new AppError(401, "AUTH_INVALID_CREDENTIALS", error?.message ?? "Unable to sign in.");
    }

    return mapSession(data.session);
  }

  async getUser(accessToken: string): Promise<AuthUser | null> {
    const client = this.clientFactory.createAuthClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return mapAuthUser(data.user);
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    const client = this.clientFactory.createAuthClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new AppError(401, "AUTH_SESSION_EXPIRED", error?.message ?? "Session expired.");
    }

    return mapSession(data.session);
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }
}
