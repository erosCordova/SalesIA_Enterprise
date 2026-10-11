import {
  apiFetch,
} from "./api";

import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  Customer,
  CustomerCreate,
  CustomerHistoryItem,
  CustomerUpdate,
  InventoryItem,
  Product,
  ProductCreate,
  ProductUpdate,
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


export function updateCustomer(
  id: string,
  payload: CustomerUpdate,
) {
  return apiFetch<Customer>(
    `/customers/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}


export function deleteCustomer(
  id: string,
) {
  return apiFetch<{ message: string }>(
    `/customers/${id}`,
    {
      method: "DELETE",
    },
  );
}


export function getCustomerHistory(
  id: string,
) {
  return apiFetch<CustomerHistoryItem[]>(
    `/customers/${id}/history`,
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


export function updateCategory(
  id: string,
  payload: CategoryUpdate,
) {
  return apiFetch<Category>(
    `/categories/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}


export function deleteCategory(
  id: string,
) {
  return apiFetch<{ message: string }>(
    `/categories/${id}`,
    {
      method: "DELETE",
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


export function updateProduct(
  id: string,
  payload: ProductUpdate,
) {
  return apiFetch<Product>(
    `/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}


export function uploadProductImage(
  id: string,
  image: File,
) {
  const formData =
    new FormData();

  formData.append(
    "image",
    image,
  );

  return apiFetch<Product>(
    `/products/${id}/image`,
    {
      method: "POST",
      body: formData,
    },
  );
}


export function deleteProduct(
  id: string,
) {
  return apiFetch<{ message: string }>(
    `/products/${id}`,
    {
      method: "DELETE",
    },
  );
}


export function getInventory() {
  return apiFetch<InventoryItem[]>(
    "/inventory",
  );
}


export function getSales(
  branchId?: string,
) {
  const query =
    branchId
      ? `?branch_id=${encodeURIComponent(
          branchId,
        )}`
      : "";

  return apiFetch<SaleListItem[]>(
    `/sales${query}`,
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


export function getSaleDetail(
  saleId: string,
) {
  return apiFetch<
    import("../types/commercial").SaleView
  >(
    `/sales/${saleId}`,
  );
}


export function cancelSale(
  saleId: string,
  reason: string,
) {
  return apiFetch<
    import("../types/commercial").SaleView
  >(
    `/sales/${saleId}/cancel`,
    {
      method: "PATCH",
      body: JSON.stringify({
        reason,
      }),
    },
  );
}

export function getArchivedCustomers() {
  return apiFetch<Customer[]>("/customers?archived=true");
}

export function archiveCustomer(id: string) {
  return apiFetch<Customer>(`/customers/${id}/archive`, {
    method: "PATCH",
  });
}

export function restoreCustomer(id: string) {
  return apiFetch<Customer>(`/customers/${id}/restore`, {
    method: "PATCH",
  });
}
