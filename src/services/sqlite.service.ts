import { getDatabase } from '../config/database';
import { TableColumnInfo } from '../types/database.types';

export const executeQuery = async (sql: string, params: unknown[] = []) => {
  const db = await getDatabase();
  // Using .all() for SELECT and PRAGMA queries to return data. 
  // For execute-only queries, this still works and returns empty arrays.
  const data = await db.all(sql, params);
  
  // Note: sqlite package's db.all doesn't natively return row count of affected rows for non-select.
  // But since we only allow SELECT/PRAGMA/WITH (for allowed queries), rowCount is data.length.
  return {
    rowCount: data.length,
    data,
  };
};

export const getTableColumns = async (tableName: string): Promise<string[]> => {
  const db = await getDatabase();

  // Safe interpolation: wrap in double quotes and escape existing double quotes
  const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
  const infoSafe = await db.all<TableColumnInfo[]>(`PRAGMA table_info(${safeTableName})`);
  
  return infoSafe.map(col => col.name);
};

export const createTable = async (tableName: string, columns: string[]): Promise<void> => {
  const db = await getDatabase();
  const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
  
  // All fields are TEXT for simplicity per requirements
  const colDefs = columns.map(col => `"${col.replace(/"/g, '""')}" TEXT`).join(', ');
  
  const sql = `CREATE TABLE IF NOT EXISTS ${safeTableName} (${colDefs})`;
  await db.exec(sql);
};

export const addColumns = async (tableName: string, newColumns: string[]): Promise<void> => {
  const db = await getDatabase();
  const safeTableName = `"${tableName.replace(/"/g, '""')}"`;

  for (const col of newColumns) {
    const safeCol = `"${col.replace(/"/g, '""')}"`;
    const sql = `ALTER TABLE ${safeTableName} ADD COLUMN ${safeCol} TEXT`;
    await db.exec(sql);
  }
};

export const bulkInsert = async (tableName: string, columns: string[], rows: Record<string, string>[]): Promise<number> => {
  const db = await getDatabase();
  const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
  const safeCols = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  
  const insertSql = `INSERT INTO ${safeTableName} (${safeCols}) VALUES (${placeholders})`;
  
  let importedCount = 0;

  // Use a transaction for bulk inserts to significantly improve performance
  await db.exec('BEGIN TRANSACTION');
  try {
    const stmt = await db.prepare(insertSql);
    for (const row of rows) {
      const values = columns.map(col => row[col] ?? null);
      await stmt.run(values);
      importedCount++;
    }
    await stmt.finalize();
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }

  return importedCount;
};
