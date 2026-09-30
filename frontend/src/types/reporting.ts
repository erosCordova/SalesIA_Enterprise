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
