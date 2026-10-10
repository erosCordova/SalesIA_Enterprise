import {
  apiFetch,
} from "./api";

import type {
  SalesForecastResponse,
} from "../types/forecasting";


interface ForecastOptions {
  horizonDays: number;
  historyDays: number;
  branchId?: string;
}


export function getSalesForecast(
  options: ForecastOptions,
) {
  const params =
    new URLSearchParams();

  params.set(
    "horizon_days",
    String(
      options.horizonDays,
    ),
  );

  params.set(
    "history_days",
    String(
      options.historyDays,
    ),
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
    SalesForecastResponse
  >(
    `/forecasts/sales?${params.toString()}`,
  );
}
