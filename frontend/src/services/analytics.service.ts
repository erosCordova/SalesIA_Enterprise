
import { apiFetch } from "./api";

import type {
  BayesRequest,
  BayesResponse,
  CompareStatisticsResponse,
  RandomVariableRequest,
  RandomVariableResponse,
  AnalyticsDashboardResponse,SalesStatisticsRequest,
  SalesStatisticsResponse,
} from "../types/analytics";

// Comparar estadísticas
export function compareStatistics(values: number[]) {
  return apiFetch<CompareStatisticsResponse>("/statistics/compare", {
    method: "POST",
    body: JSON.stringify({ values }),
  });
}

// Calcular probabilidad de Bayes
export function calculateBayes(payload: BayesRequest) {
  return apiFetch<BayesResponse>("/probability/bayes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Analizar variable aleatoria
export function analyzeRandomVariable(payload: RandomVariableRequest) {
  return apiFetch<RandomVariableResponse>("/random-variables/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Consultar dashboard analítico de ventas
export function getAnalyticsDashboard(
  startDate?: string,
  endDate?: string,
) {
  const params = new URLSearchParams();

  if (startDate) {
    params.set("start_date", startDate);
  }

  if (endDate) {
    params.set("end_date", endDate);
  }

  const query = params.toString();

  return apiFetch<AnalyticsDashboardResponse>(
    `/analytics/dashboard${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}
export async function analyzeSalesStatistics(
  startDate?: string,
  endDate?: string,
): Promise<SalesStatisticsResponse> {
  const body: SalesStatisticsRequest = {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  };

  return apiFetch<SalesStatisticsResponse>(
    "/analytics/sales-analysis",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}