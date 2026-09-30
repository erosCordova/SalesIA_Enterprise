import {
  apiFetch,
} from "./api";

import type {
  BayesRequest,
  BayesResponse,
  CompareStatisticsResponse,
  RandomVariableRequest,
  RandomVariableResponse,
} from "../types/analytics";


export function compareStatistics(
  values: number[],
) {
  return apiFetch<CompareStatisticsResponse>(
    "/statistics/compare",
    {
      method: "POST",
      body: JSON.stringify({
        values,
      }),
    },
  );
}


export function calculateBayes(
  payload: BayesRequest,
) {
  return apiFetch<BayesResponse>(
    "/probability/bayes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export function analyzeRandomVariable(
  payload: RandomVariableRequest,
) {
  return apiFetch<RandomVariableResponse>(
    "/random-variables/analyze",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
