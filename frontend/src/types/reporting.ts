export interface InsightItem {
  id: string;

  title: string;
  description: string;

  insight_type: string | null;
  severity: string | null;

  evidence:
    | Record<string, unknown>
    | null;

  status: string;
  created_at: string;
}


export interface ReportItem {
  id: string;

  name: string;
  report_type: string;

  parameters:
    | Record<string, unknown>
    | null;

  file_url: string | null;

  status: string;
  created_at: string;
}


export interface ModuleStatus {
  module: string;
  status: string;
}


export type BusinessReportType =
  | "sales"
  | "branches"
  | "products"
  | "customers"
  | "inventory"
  | "kardex";


export interface BusinessReportSummaryItem {
  key: string;
  label: string;

  value:
    | string
    | number;

  format:
    | "text"
    | "number"
    | "currency";
}


export interface BusinessReportColumn {
  key: string;
  label: string;

  format:
    | "text"
    | "number"
    | "currency"
    | "date";
}


export interface BusinessReportResponse {
  report_type:
    BusinessReportType;

  title: string;
  description: string;

  branch_id: string | null;
  branch_name: string;

  start_date: string;
  end_date: string;

  generated_at: string;

  summary:
    BusinessReportSummaryItem[];

  columns:
    BusinessReportColumn[];

  rows:
    Record<
      string,
      unknown
    >[];
}
