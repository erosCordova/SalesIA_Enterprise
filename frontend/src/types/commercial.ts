export type StatusValue =
  | "active"
  | "inactive";

export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "yape"
  | "plin"
  | "other";

export type DecimalValue =
  | number
  | string;

export interface Customer {
  id: string;
  document_type: string | null;
  document_number: string | null;

  first_name: string | null;
  last_name: string | null;
  business_name: string | null;

  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;

  status: string;
}

export interface CustomerCreate {
  document_type: string;
  document_number: string;

  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;

  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;

  status?: StatusValue;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface CategoryCreate {
  name: string;
  description?: string | null;
  status?: StatusValue;
}

export interface Product {
  id: string;

  category_id: string | null;
  category_name: string | null;

  sku: string;
  name: string;
  description: string | null;
  unit: string;

  sale_price: DecimalValue;
  cost_price: DecimalValue;

  stock_quantity: DecimalValue;
  minimum_stock: DecimalValue;
  maximum_stock: DecimalValue | null;

  status: string;
}

export interface ProductCreate {
  category_id?: string | null;

  sku: string;
  name: string;

  description?: string | null;

  unit: string;

  sale_price: number;
  cost_price: number;

  initial_stock: number;
  minimum_stock: number;
  maximum_stock?: number | null;

  status?: StatusValue;
}

export interface InventoryItem {
  inventory_id: string;
  product_id: string;

  sku: string;
  product_name: string;

  stock_quantity: DecimalValue;
  minimum_stock: DecimalValue;
  maximum_stock: DecimalValue | null;

  stock_status: string;
}

export interface SaleItemCreate {
  product_id: string;
  quantity: number;
  discount: number;
}

export interface SaleCreate {
  customer_id?: string | null;

  items: SaleItemCreate[];

  sale_discount: number;
  tax_rate: number;

  payment_method: PaymentMethod;
  payment_reference?: string | null;

  notes?: string | null;
}

export interface SaleDetail {
  product_id: string;
  product_name: string;

  quantity: DecimalValue;
  unit_price: DecimalValue;
  discount: DecimalValue;
  subtotal: DecimalValue;
}

export interface SaleCreated {
  id: string;
  sale_number: string;

  customer_id: string | null;

  subtotal: DecimalValue;
  discount: DecimalValue;
  tax: DecimalValue;
  total: DecimalValue;

  status: string;
  payment_method: string;

  items: SaleDetail[];
}

export interface SaleListItem {
  id: string;
  sale_number: string;

  customer_id: string | null;
  customer_name: string;

  sale_date: string;

  subtotal: DecimalValue;
  discount: DecimalValue;
  tax: DecimalValue;
  total: DecimalValue;

  status: string;
}
