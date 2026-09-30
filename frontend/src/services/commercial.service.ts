import {
  apiFetch,
} from "./api";

import type {
  Category,
  CategoryCreate,
  Customer,
  CustomerCreate,
  InventoryItem,
  Product,
  ProductCreate,
  SaleCreate,
  SaleCreated,
  SaleListItem,
} from "../types/commercial";


export function getCustomers() {
  return apiFetch<Customer[]>(
    "/customers",
  );
}


export function createCustomer(
  payload: CustomerCreate,
) {
  return apiFetch<Customer>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export function getCategories() {
  return apiFetch<Category[]>(
    "/categories",
  );
}


export function createCategory(
  payload: CategoryCreate,
) {
  return apiFetch<Category>(
    "/categories",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export function getProducts() {
  return apiFetch<Product[]>(
    "/products",
  );
}


export function createProduct(
  payload: ProductCreate,
) {
  return apiFetch<Product>(
    "/products",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export function getInventory() {
  return apiFetch<InventoryItem[]>(
    "/inventory",
  );
}


export function getSales() {
  return apiFetch<SaleListItem[]>(
    "/sales",
  );
}


export function createSale(
  payload: SaleCreate,
) {
  return apiFetch<SaleCreated>(
    "/sales",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
