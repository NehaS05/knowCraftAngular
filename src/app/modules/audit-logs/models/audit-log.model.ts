export interface AuditLog {
  timestamp: string;
  user: string;
  role: 'INTERNAL TEAM' | 'CLIENT';
  queries: number;
}

export interface AuditLogDto {
  id: number;
  userEmail: string;
  userRole: string;
  queryPreview?: string;
  responsePreview?: string;
  timestamp: string;
}

export interface AuditLogSummaryDto {
  userEmail: string;
  userRole: string;
  date: string;
  requestCount: number;
}