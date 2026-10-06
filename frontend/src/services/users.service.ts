import {
  apiFetch,
} from "./api";

import type {
  CreateUserRequest,
  RoleResponse,
  UpdateUserRequest,
  UserCreatedResponse,
  UserListItem,
} from "../types/users";


export function getUsers() {
  return apiFetch<UserListItem[]>(
    "/users",
  );
}


export function getRoles() {
  return apiFetch<RoleResponse[]>(
    "/users/roles",
  );
}


export function createUser(
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


export function updateUser(
  userId: string,
  data: UpdateUserRequest,
) {
  return apiFetch<UserListItem>(
    `/users/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}
