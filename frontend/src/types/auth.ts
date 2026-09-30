export type UserRole =
  | "Administrador"
  | "Gerente"
  | "Vendedor"
  | "Analista"
  | "Almacén";

export interface LoginRequest {
  dni: string;
  password: string;
}

export interface AuthUser {
  id: string;
  auth_user_id: string;
  company_id: string;
  dni: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role: UserRole;
  company: string;
  status: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number | null;
  user: AuthUser;
}
