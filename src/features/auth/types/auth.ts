export interface AuthUser {
  id: string;
  login: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user?: AuthUser;
}
