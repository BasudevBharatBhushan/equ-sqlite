import { Request, Response, NextFunction } from 'express';
import { importFileData } from '../services/import.service';
import { ApiErrorResponse } from '../types/api.types';

export const importCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.body;
    const file = req.file;

    if (!tableName || typeof tableName !== 'string') {
      const errorResponse: ApiErrorResponse = { success: false, error: 'Missing or invalid tableName parameter' };
      return res.status(400).json(errorResponse);
    }

    if (!file) {
      const errorResponse: ApiErrorResponse = { success: false, error: 'No file uploaded' };
      return res.status(400).json(errorResponse);
    }

    const result = await importFileData(
      tableName,
      file.path,
      file.mimetype,
      file.originalname
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};
