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
  dni?: string;
}


export interface CustomerAccountUpdatePayload
  extends CustomerCreate {
  email?: string | null;
  password?: string;
  dni?: string;
}


export type CustomerAccountResponse =
  Record<string, unknown>;


export interface CustomerPortalCustomer {
  id?: string;
  company_id?: string;

  document_type?: string | null;
  document_number?: string | null;

  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;

  email?: string | null;
  phone?: string | null;

  address?: string | null;
  city?: string | null;

  status?: string | null;
}


export interface CustomerPortalSaleItem {
  sale_id?: string;
  product_id?: string;

  sku?: string | null;
  product_name?: string | null;
  unit?: string | null;

  quantity?: number | string | null;
  unit_price?: number | string | null;
  discount?: number | string | null;
  subtotal?: number | string | null;
}


export interface CustomerPortalSale {
  id?: string;

  sale_number?: string | null;
  sale_date?: string | null;

  subtotal?: number | string | null;
  discount?: number | string | null;
  tax?: number | string | null;
  total?: number | string | null;

  status?: string | null;
  items?: CustomerPortalSaleItem[];
}


export interface CustomerPortalResponse {
  customer: CustomerPortalCustomer;
  sales: CustomerPortalSale[];
}


export interface CustomerPasswordChange {
  current_password: string;
  new_password: string;
}


export interface CustomerProfileUpdate {
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
}


export function getCustomerAccounts() {
  return apiFetch<CustomerAccountResponse[]>(
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

      body:
        JSON.stringify(
          payload,
        ),
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

      body:
        JSON.stringify(
          payload,
        ),
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
  return apiFetch<CustomerPortalResponse>(
    "/customer-accounts/portal/me",
  );
}


export function updateCustomerProfile(
  payload: CustomerProfileUpdate,
) {
  return apiFetch<CustomerPortalCustomer>(
    "/customer-accounts/portal/me",
    {
      method: "PUT",

      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}



export function changeCustomerPassword(
  payload: CustomerPasswordChange,
) {
  return apiFetch<{
    message: string;
  }>(
    "/customer-accounts/portal/password",
    {
      method: "PUT",

      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}
