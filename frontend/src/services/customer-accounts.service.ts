import {
  apiFetch,
} from "./api";

import type {
  CustomerCreate,
} from "../types/commercial";


export interface CustomerAccountCreatePayload
  extends CustomerCreate {
  email: string;
  password: string;
}


export interface CustomerAccountUpdatePayload
  extends CustomerCreate {
  email?: string | null;
  password?: string;
}


export type CustomerAccountResponse =
  Record<string, unknown>;


export function getCustomerAccounts() {
  return apiFetch<
    CustomerAccountResponse[]
  >(
    "/customer-accounts",
  );
}


export function createCustomerAccount(
  payload: CustomerAccountCreatePayload,
) {
  return apiFetch<CustomerAccountResponse>(
    "/customer-accounts",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export function updateCustomerAccount(
  customerId: string,
  payload: CustomerAccountUpdatePayload,
) {
  return apiFetch<CustomerAccountResponse>(
    `/customer-accounts/${customerId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}


export function deactivateCustomerAccount(
  customerId: string,
) {
  return apiFetch<Record<string, unknown>>(
    `/customer-accounts/${customerId}`,
    {
      method: "DELETE",
    },
  );
}


export function getCustomerPortal() {
  return apiFetch<Record<string, unknown>>(
    "/customer-accounts/portal/me",
  );
}
