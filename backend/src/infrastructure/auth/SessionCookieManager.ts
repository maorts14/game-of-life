import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthSession } from "../../domain/auth/AuthService.js";
import type { AppEnv } from "../config/env.js";

interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: AuthSession["user"];
  csrfToken: string;
}

const SESSION_COOKIE_NAME = "gol_session";
const CSRF_COOKIE_NAME = "gol_csrf";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export class SessionCookieManager {
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = createHash("sha256").update(secret).digest();
  }

  createCsrfToken() {
    return randomBytes(24).toString("base64url");
  }

  encodeSession(session: AuthSession, csrfToken: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const payload = JSON.stringify({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      user: session.user,
      csrfToken,
    } satisfies SessionPayload);
    const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString("base64url");
  }

  decodeSession(rawCookieValue: string | undefined): SessionPayload | null {
    if (!rawCookieValue) {
      return null;
    }

    try {
      const buffer = Buffer.from(rawCookieValue, "base64url");
      const iv = buffer.subarray(0, 12);
      const tag = buffer.subarray(12, 28);
      const encrypted = buffer.subarray(28);
      const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return JSON.parse(decrypted.toString("utf8")) as SessionPayload;
    } catch {
      return null;
    }
  }

  setSessionCookies(reply: FastifyReply, env: AppEnv, session: AuthSession, csrfToken: string) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    };
    const csrfCookieOptions = {
      httpOnly: false,
      sameSite: "lax" as const,
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    };

    reply.setCookie(SESSION_COOKIE_NAME, this.encodeSession(session, csrfToken), cookieOptions);
    reply.setCookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
  }

  clearSessionCookies(reply: FastifyReply, env: AppEnv) {
    const cookieOptions = {
      path: "/",
      sameSite: "lax" as const,
      secure: env.NODE_ENV === "production",
    };

    reply.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
    reply.clearCookie(CSRF_COOKIE_NAME, cookieOptions);
  }

  validateCsrf(request: FastifyRequest, session: SessionPayload): boolean {
    const csrfCookie = request.cookies[CSRF_COOKIE_NAME];
    const csrfHeader = request.headers["x-csrf-token"];

    if (typeof csrfHeader !== "string") {
      return false;
    }

    return csrfCookie === session.csrfToken && csrfHeader === session.csrfToken;
  }

  get sessionCookieName() {
    return SESSION_COOKIE_NAME;
  }
}
