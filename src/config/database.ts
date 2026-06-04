import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { env } from './env';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;

export const getDatabase = async (): Promise<Database> => {
  if (dbInstance) {
    return dbInstance;
  }
  
  const dbPath = env.DB_PATH;
  
  // Ensure the directory for the database exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return dbInstance;
};
