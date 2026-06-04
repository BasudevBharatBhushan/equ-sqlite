import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

import healthRoutes from './routes/health.routes';
import importRoutes from './routes/import.routes';
import queryRoutes from './routes/query.routes';
import { errorHandler } from './middleware/error.middleware';

// Ensure uploads directory exists for multer
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/health', healthRoutes);
app.use('/import-csv', importRoutes);
app.use('/query', queryRoutes);

// Error Handling
app.use(errorHandler);

export default app;
