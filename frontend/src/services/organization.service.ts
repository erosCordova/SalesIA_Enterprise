import {
  apiFetch,
} from "./api";

import type {
  Branch,
  BranchCreate,
  BranchUpdate,
  Company,
  CompanyUpdate,
} from "../types/organization";


export function getCompany() {
  return apiFetch<Company>(
    "/company",
  );
}


export function updateCompany(
  payload: CompanyUpdate,
) {
  return apiFetch<Company>(
    "/company",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}


export function getBranches() {
  return apiFetch<Branch[]>(
    "/branches",
  );
}


export function createBranch(
  payload: BranchCreate,
) {
  return apiFetch<Branch>(
    "/branches",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export function updateBranch(
  branchId: string,
  payload: BranchUpdate,
) {
  return apiFetch<Branch>(
    `/branches/${branchId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
