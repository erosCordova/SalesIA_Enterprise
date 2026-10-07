export type ManualType =
  | "user"
  | "technical";


export interface ManualDocument {
  manual_type:
    ManualType;

  title:
    string;

  file_name:
    string;

  mime_type:
    string;

  size_bytes:
    number;

  created_at:
    string;

  updated_at:
    string;
}
