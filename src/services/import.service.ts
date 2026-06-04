import fs from 'fs';
import { parseFile } from '../utils/file-parser';
import * as sqliteService from './sqlite.service';

export const importFileData = async (
  tableName: string, 
  filePath: string, 
  mimetype: string, 
  originalName: string
) => {
  try {
    // 1. Parse File
    const { headers, rows } = await parseFile(filePath, mimetype, originalName);

    if (headers.length === 0) {
      throw new Error('File has no headers or is empty');
    }

    // 2. Schema Discovery / Creation
    // We check if table exists by trying to get columns.
    // However, PRAGMA table_info returns empty array if table doesn't exist.
    const existingCols = await sqliteService.getTableColumns(tableName);
    
    if (existingCols.length === 0) {
      // Create table
      await sqliteService.createTable(tableName, headers);
    } else {
      // Add missing columns
      const missingCols = headers.filter(h => !existingCols.includes(h));
      if (missingCols.length > 0) {
        await sqliteService.addColumns(tableName, missingCols);
      }
    }

    // 3. Bulk Insert
    const totalRecordsImported = await sqliteService.bulkInsert(tableName, headers, rows);

    return {
      success: true,
      tableName,
      totalColumns: headers.length,
      totalRecordsImported
    };
  } finally {
    // 4. Cleanup temp file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete temporary file:', err);
      }
    }
  }
};
