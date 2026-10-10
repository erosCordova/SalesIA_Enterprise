import {
  apiFetch,
} from "./api";

import type {
  BusinessReportResponse,
  BusinessReportType,
  InsightItem,
  ModuleStatus,
  ReportItem,
} from "../types/reporting";


export function getInsights() {
  return apiFetch<
    InsightItem[]
  >(
    "/insights",
  );
}


export function generateInsights() {
  return apiFetch<
    InsightItem[]
  >(
    "/insights/generate",
    {
      method: "POST",
    },
  );
}


export function getReports() {
  return apiFetch<
    ReportItem[]
  >(
    "/reports",
  );
}


export function getBusinessReport(
  options: {
    reportType:
      BusinessReportType;

    startDate: string;
    endDate: string;

    branchId?: string;
  },
) {
  const params =
    new URLSearchParams();

  params.set(
    "report_type",
    options.reportType,
  );

  params.set(
    "start_date",
    options.startDate,
  );

  params.set(
    "end_date",
    options.endDate,
  );

  if (
    options.branchId
  ) {
    params.set(
      "branch_id",
      options.branchId,
    );
  }

  return apiFetch<
    BusinessReportResponse
  >(
    `/reports/business?${params.toString()}`,
  );
}


export function getReportsStatus() {
  return apiFetch<
    ModuleStatus
  >(
    "/reports/status",
  );
}


export function getAuditStatus() {
  return apiFetch<
    ModuleStatus
  >(
    "/audit/status",
  );
}
