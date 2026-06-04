export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  [key: string]: unknown; // Allow other properties for specific endpoints
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export interface ImportCsvResponse {
  success: true;
  tableName: string;
  totalColumns: number;
  totalRecordsImported: number;
}

export interface ExecuteSqlResponse {
  success: true;
  rowCount: number;
  data: Record<string, unknown>[];
}

export interface HealthResponse {
  success: true;
  status: string;
}
