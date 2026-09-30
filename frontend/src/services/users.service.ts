import { apiFetch } from "./api";

import type {
  CreateUserRequest,
  RoleResponse,
  UserCreatedResponse,
  UserListItem,
} from "../types/users";


export async function getUsers() {
  return apiFetch<UserListItem[]>(
    "/users",
  );
}


export async function getRoles() {
  return apiFetch<RoleResponse[]>(
    "/users/roles",
  );
}


export async function createUser(
  data: CreateUserRequest,
) {
  return apiFetch<UserCreatedResponse>(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
