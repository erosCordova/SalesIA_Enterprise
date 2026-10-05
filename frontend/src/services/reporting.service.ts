import {
  API_URL,
  apiFetch,
} from "./api";

import type {
  InsightItem,
  ModuleStatus,
  ReportGenerateRequest,
  ReportItem,
} from "../types/reporting";


export function getInsights() {
  return apiFetch<InsightItem[]>(
    "/insights",
  );
}


export function getReports() {
  return apiFetch<ReportItem[]>(
    "/reports",
  );
}


export function getReportsStatus() {
  return apiFetch<ModuleStatus>(
    "/reports/status",
  );
}


export function getAuditStatus() {
  return apiFetch<ModuleStatus>(
    "/audit/status",
  );
}


/**
 * Genera un nuevo reporte.
 */
export function generateReport(
  data: ReportGenerateRequest,
) {
  return apiFetch<ReportItem>(
    "/reports/generate",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


/**
 * Descarga el archivo generado
 * por el backend.
 */
export async function downloadReport(
  reportId: string,
): Promise<Blob> {
  const token =
    localStorage.getItem(
      "access_token",
    );

  const response =
    await fetch(
      `${API_URL}/reports/${reportId}/download`,
      {
        headers: {
          Accept: "text/csv",
          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
      },
    );

  if (!response.ok) {
    const data =
      await response
        .json()
        .catch(() => null);

    const message =
      typeof data?.detail ===
      "string"
        ? data.detail
        : "No se pudo descargar el reporte.";

    throw new Error(message);
  }

  return response.blob();
}