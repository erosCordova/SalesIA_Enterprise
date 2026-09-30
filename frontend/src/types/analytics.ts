export interface CompareStatisticsResponse {
  count: number;
  mean: number;
  median: number;
  difference: number;
  interpretation: string;
}

export interface BayesRequest {
  event_a: string;
  event_b: string;

  probability_a: number;
  probability_b_given_a: number;
  probability_b: number;
}

export interface BayesResponse
  extends BayesRequest {
  posterior_probability: number;

  formula: string;
  interpretation: string;
}

export interface RandomVariableRequest {
  name: string;

  values: number[];
  probabilities: number[];
}

export interface RandomVariableResponse {
  name: string;

  expected_value: number;
  variance: number;
  standard_deviation: number;

  observations: number;
}
