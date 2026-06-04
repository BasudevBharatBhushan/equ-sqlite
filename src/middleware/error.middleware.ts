import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../types/api.types';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.url} -`, err.message);
  console.error(err.stack);
  
  const response: ApiErrorResponse = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  res.status(500).json(response);
};
