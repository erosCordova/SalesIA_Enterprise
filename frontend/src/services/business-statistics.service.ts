import {
  apiFetch,
} from "./api";

import type {
  SalesBusinessStatistics,
} from "../types/business-statistics";


interface StatisticsFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
}


export function getSalesBusinessStatistics(
  filters: StatisticsFilters,
) {
  const params =
    new URLSearchParams();

  params.set(
    "start_date",
    filters.startDate,
  );

  params.set(
    "end_date",
    filters.endDate,
  );

  if (
    filters.branchId
  ) {
    params.set(
      "branch_id",
      filters.branchId,
    );
  }

  return apiFetch<
    SalesBusinessStatistics
  >(
    `/statistics/sales-summary?${params.toString()}`,
  );
}
