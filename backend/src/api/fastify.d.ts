import type { AuthUser } from "../domain/auth/AuthService.js";

declare module "fastify" {
  interface FastifyRequest {
    auth: {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
      csrfToken: string;
    } | null;
  }
}
