import {
  apiFetch,
} from "./api";

import type {
  BusinessInsightsResponse,
} from "../types/business-insights";


export function getBusinessInsights(
  branchId?: string,
) {
  const params =
    new URLSearchParams();

  if (
    branchId
  ) {
    params.set(
      "branch_id",
      branchId,
    );
  }

  const query =
    params.toString();

  return apiFetch<
    BusinessInsightsResponse
  >(
    `/insights/business${
      query
        ? `?${query}`
        : ""
    }`,
  );
}
