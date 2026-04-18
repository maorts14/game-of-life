export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: AuthUser;
}

export interface SignUpResult {
  user: AuthUser | null;
  session: AuthSession | null;
  requiresEmailConfirmation: boolean;
}

export interface AuthService {
  signUp(email: string, password: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<AuthSession>;
  getUser(accessToken: string): Promise<AuthUser | null>;
  refreshSession(refreshToken: string): Promise<AuthSession>;
  signOut(accessToken: string): Promise<void>;
}
