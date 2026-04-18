import { apiRequest } from "./http";

export interface SessionUser {
  id: string;
  email: string | null;
}

interface AuthResponse {
  user: SessionUser | null;
}

interface SignUpResponse {
  user: SessionUser | null;
  requiresEmailConfirmation: boolean;
}

export function getMe() {
  return apiRequest<AuthResponse>("/api/me");
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    json: {
      email,
      password,
    },
  });
}

export function signup(email: string, password: string) {
  return apiRequest<SignUpResponse>("/api/auth/signup", {
    method: "POST",
    json: {
      email,
      password,
    },
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}
