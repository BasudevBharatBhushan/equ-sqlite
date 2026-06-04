export interface ExecuteSqlPayload {
  sql: string;
  params?: unknown[];
}

export interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown | null;
  pk: number;
}
