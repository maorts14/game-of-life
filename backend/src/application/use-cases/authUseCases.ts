import type { AuthService } from "../../domain/auth/AuthService.js";

export async function signUp(authService: AuthService, email: string, password: string) {
  return authService.signUp(email, password);
}

export async function signIn(authService: AuthService, email: string, password: string) {
  return authService.signIn(email, password);
}

export async function signOut(authService: AuthService, accessToken: string) {
  await authService.signOut(accessToken);
}
