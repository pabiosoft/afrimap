// Types relatifs à l'authentification et aux utilisateurs

export interface User {
  "@context"?: string;
  "@id"?: string;
  "@type"?: string;
  username: string;
  email: string;
  isActif?: boolean;
}

export interface UserCredentials {
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiError {
  "@context"?: string;
  "@id"?: string;
  "@type"?: string;
  status?: number;
  title?: string;
  detail?: string;
  instance?: string;
  type?: string;
  description?: string;
  violations?: Array<{
    propertyPath: string;
    message: string;
  }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
