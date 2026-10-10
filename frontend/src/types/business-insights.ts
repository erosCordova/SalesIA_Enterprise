export type BusinessInsightCategory =
  | "attention"
  | "opportunity"
  | "trend"
  | "info";


export type BusinessInsightSeverity =
  | "high"
  | "medium"
  | "low";


export interface BusinessInsightMetric {
  label: string;
  value: string;
}


export interface BusinessInsight {
  id: string;

  category:
    BusinessInsightCategory;

  severity:
    BusinessInsightSeverity;

  title: string;
  description: string;
  reason: string;

  action_label: string;
  action_path: string;

  metrics:
    BusinessInsightMetric[];
}


export interface BusinessInsightsResponse {
  branch_id: string | null;
  branch_name: string;

  period_start: string;
  period_end: string;

  comparison_start: string;
  comparison_end: string;

  generated_at: string;

  current_sales: number;
  current_revenue: number;
  current_average_ticket: number;
  active_days: number;

  insights:
    BusinessInsight[];
}
