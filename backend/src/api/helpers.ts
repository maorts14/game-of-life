import type { FastifyRequest } from "fastify";
import { HttpError } from "../shared/errors/httpError.js";
import type { AuthContext } from "./types.js";

export function parseWithSchema<T>(schema: { parse: (value: unknown) => T }, value: unknown): T {
  return schema.parse(value);
}

export function requireAuth(request: FastifyRequest): AuthContext {
  if (!request.authContext) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required.");
  }

  return request.authContext;
}
