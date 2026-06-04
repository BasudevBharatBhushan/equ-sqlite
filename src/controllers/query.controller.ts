import { Request, Response, NextFunction } from 'express';
import { executeQuery } from '../services/sqlite.service';
import { validateSql } from '../utils/sql-validator';
import { ExecuteSqlResponse, ApiErrorResponse } from '../types/api.types';
import { ExecuteSqlPayload } from '../types/database.types';

export const executeSql = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as ExecuteSqlPayload;

    if (!payload.sql || typeof payload.sql !== 'string') {
      const errorResponse: ApiErrorResponse = { success: false, error: 'Missing or invalid sql parameter' };
      return res.status(400).json(errorResponse);
    }

    const validation = validateSql(payload.sql);
    if (!validation.isValid) {
      const errorResponse: ApiErrorResponse = { success: false, error: validation.error || 'Invalid SQL query' };
      return res.status(403).json(errorResponse);
    }

    const result = await executeQuery(payload.sql, payload.params || []);

    const response: ExecuteSqlResponse = {
      success: true,
      rowCount: result.rowCount,
      data: result.data as Record<string, unknown>[],
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
