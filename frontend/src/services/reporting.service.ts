import { apiFetch } from "./api";

import type { InsightItem, ModuleStatus, ReportItem } from "../types/reporting";

export function getInsights() {
  return apiFetch<InsightItem[]>("/insights");
}

export function generateInsights() {
  return apiFetch<InsightItem[]>("/insights/generate", { method: "POST" });
}

export function getReports() {
  return apiFetch<ReportItem[]>("/reports");
}

export function getReportsStatus() {
  return apiFetch<ModuleStatus>("/reports/status");
}

export function getAuditStatus() {
  return apiFetch<ModuleStatus>("/audit/status");
}
