export interface AuditLogItem {
  id: string;

  company_id:
    string | null;

  user_id:
    string | null;

  user_name:
    string;

  user_role:
    string | null;

  action:
    string;

  table_name:
    string | null;

  record_id:
    string | null;

  old_data:
    Record<string, unknown> | null;

  new_data:
    Record<string, unknown> | null;

  ip_address:
    string | null;

  user_agent:
    string | null;

  created_at:
    string;
}
