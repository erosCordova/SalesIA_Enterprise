export type OrganizationStatus =
  | "active"
  | "inactive";


export interface Company {
  id: string;

  name: string;
  business_name: string | null;
  tax_id: string | null;

  email: string | null;
  phone: string | null;

  address: string | null;
  city: string | null;
  country: string | null;

  status: OrganizationStatus | string;

  created_at: string;
  updated_at: string;
}


export interface CompanyUpdate {
  name?: string;
  business_name?: string | null;
  tax_id?: string | null;

  email?: string | null;
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  country?: string | null;

  status?: OrganizationStatus;
}


export interface Branch {
  id: string;
  company_id: string;

  code: string;
  name: string;

  address: string | null;
  city: string | null;

  department: string | null;
  province: string | null;
  district: string | null;

  latitude: number | null;
  longitude: number | null;

  country: string | null;

  phone: string | null;
  email: string | null;

  status: OrganizationStatus | string;

  created_at: string;
  updated_at: string;
}


export interface BranchCreate {
  code: string;
  name: string;

  address?: string | null;
  city?: string | null;

  department?: string | null;
  province?: string | null;
  district?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  country?: string;

  phone?: string | null;
  email?: string | null;

  status?: OrganizationStatus;
}


export interface BranchUpdate {
  code?: string;
  name?: string;

  address?: string | null;
  city?: string | null;

  department?: string | null;
  province?: string | null;
  district?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  country?: string | null;

  phone?: string | null;
  email?: string | null;

  status?: OrganizationStatus;
}
