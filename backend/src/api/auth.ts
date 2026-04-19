import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { loadEnv } from "../infrastructure/config/env.js";
import { HttpError } from "../shared/errors/httpError.js";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const env = loadEnv();
    jwks = createRemoteJWKSet(new URL(env.supabaseJwksUrl));
  }

  return jwks;
}

export async function authenticateRequest(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing bearer token.");
  }

  const token = header.slice("Bearer ".length);
  const env = loadEnv();
  const verification = await jwtVerify(token, getJwks(), {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  const subject = verification.payload.sub;

  if (!subject) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid token subject.");
  }

  request.authContext = {
    userId: subject,
    token,
    email: typeof verification.payload.email === "string" ? verification.payload.email : null,
  };
}
