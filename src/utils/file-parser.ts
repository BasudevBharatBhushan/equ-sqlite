import fs from 'fs';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';

export interface ParsedFileResult {
  headers: string[];
  rows: Record<string, string>[];
}

export const parseFile = async (filePath: string, mimetype: string, originalName: string): Promise<ParsedFileResult> => {
  const isCsv = mimetype === 'text/csv' || originalName.toLowerCase().endsWith('.csv');
  const isExcel = originalName.toLowerCase().endsWith('.xlsx') || originalName.toLowerCase().endsWith('.xls');

  if (isCsv) {
    return parseCsv(filePath);
  } else if (isExcel) {
    return parseExcel(filePath);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
};

const parseCsv = (filePath: string): Promise<ParsedFileResult> => {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    let headers: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (hdr: string[]) => {
        headers = hdr.map(h => h.trim());
      })
      .on('data', (data) => {
        // Normalize keys to match trimmed headers and convert values to string
        const normalizedRow: Record<string, string> = {};
        for (const key of Object.keys(data)) {
            normalizedRow[key.trim()] = String(data[key]);
        }
        results.push(normalizedRow);
      })
      .on('end', () => {
        resolve({ headers, rows: results });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const parseExcel = async (filePath: string): Promise<ParsedFileResult> => {
  // Read file from disk
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  
  if (!sheetName) {
    throw new Error('Excel file is empty.');
  }

  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with headers explicitly included
  const jsonRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  
  if (jsonRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Extract headers from the first parsed row
  const firstRow = jsonRows[0] as Record<string, unknown>;
  const headers = Object.keys(firstRow).map(h => h.trim());

  // Stringify all values
  const rows = jsonRows.map(row => {
    const record = row as Record<string, unknown>;
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(record)) {
      normalized[key.trim()] = String(record[key]);
    }
    return normalized;
  });

  return { headers, rows };
};
