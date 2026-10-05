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


export type ReportType =
  | "sales"
  | "statistical"
  | "products"
  | "customers"
  | "employees";


export interface ReportGenerateRequest {
  report_type: ReportType;

  start_date:
    | string
    | null;

  end_date:
    | string
    | null;

  employee_id:
    | string
    | null;

  category_id:
    | string
    | null;

  name:
    | string
    | null;
}


export interface ReportItem {
  id: string;

  name: string;
  report_type: string;

  parameters:
    | Record<string, unknown>
    | null;

  file_url:
    | string
    | null;

  status: string;
  created_at: string;
}


export interface ModuleStatus {
  module: string;
  status: string;
}
