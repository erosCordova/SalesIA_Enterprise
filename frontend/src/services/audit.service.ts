import {
  apiFetch,
} from "./api";

import type {
  AuditLogItem,
} from "../types/audit";


export function getAuditLogs() {
  return apiFetch<
    AuditLogItem[]
  >(
    "/audit/logs",
  );
}
