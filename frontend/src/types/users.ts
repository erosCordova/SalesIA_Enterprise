import type {
  UserRole,
} from "./auth";


export type UserStatus =
  | "active"
  | "inactive";


export interface UserListItem {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  company: string;
  status: UserStatus | string;
}


export interface CreateUserRequest {
  dni: string;
  first_name: string;
  last_name: string;
  password: string;
  role: UserRole;
  phone: string | null;
  status: UserStatus;
}


export interface UpdateUserRequest {
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string | null;
  status: UserStatus;
}


export interface UserCreatedResponse {
  id: string;
  auth_user_id: string;
  dni: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  company: string;
  status: string;
}


export interface RoleResponse {
  id: string;
  name: UserRole;
  description: string | null;
}
