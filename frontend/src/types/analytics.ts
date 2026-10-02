
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

export interface BayesResponse extends BayesRequest {
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

export interface AnalyticsSummary {
  total_sales: number;
  total_revenue: number | string;
  average_ticket: number | string;
  median_ticket: number | string;
}

export interface DailySalesItem {
  date: string;
  sales_count: number;
  revenue: number | string;
}

export interface AnalyticsDashboardResponse {
  start_date: string | null;
  end_date: string | null;
  summary: AnalyticsSummary;
  daily_sales: DailySalesItem[];
}
export interface SalesStatisticsRequest {
  start_date?: string;
  end_date?: string;
}

export interface SalesStatisticsResponse {
  start_date: string | null;
  end_date: string | null;
  count: number;
  mean: number;
  median: number;
  difference: number;
  interpretation: string;
}