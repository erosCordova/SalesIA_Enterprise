export interface ForecastPoint {
  date: string;
  revenue: number;
  sales: number;
}


export interface SalesForecastResponse {
  branch_id: string | null;
  branch_name: string;

  history_start: string;
  history_end: string;

  history_days: number;
  horizon_days: number;

  observed_days: number;
  active_days: number;

  historical_revenue: number;
  historical_sales: number;

  average_daily_revenue: number;
  average_ticket: number;

  projected_revenue: number;
  projected_sales: number;
  projected_daily_revenue: number;

  lower_bound: number;
  upper_bound: number;

  trend_percent: number;
  trend_direction: string;

  confidence_score: number;
  confidence_label: string;

  model_name: string;
  interpretation: string;

  historical: ForecastPoint[];
  forecast: ForecastPoint[];
}
