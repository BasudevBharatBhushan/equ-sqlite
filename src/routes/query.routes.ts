import { Router } from 'express';
import { executeSql } from '../controllers/query.controller';

const router = Router();

router.post('/', executeSql);

export default router;
