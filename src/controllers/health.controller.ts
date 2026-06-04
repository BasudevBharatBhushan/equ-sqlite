import { Request, Response } from 'express';
import { HealthResponse } from '../types/api.types';
import { getDatabase } from '../config/database';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    // Check DB connection
    const db = await getDatabase();
    await db.get('SELECT 1');

    const response: HealthResponse = {
      success: true,
      status: 'healthy',
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: err instanceof Error ? err.message : String(err)
    });
  }
};
