export interface AuthContext {
  userId: string;
  token: string;
  email: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    authContext?: AuthContext;
  }
}
