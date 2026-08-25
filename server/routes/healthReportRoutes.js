// COMPLETE FILE
import express from 'express';
import {
  generateReport,
  getReportHistory,
  downloadReport
} from '../controllers/healthReportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateReport);
router.get('/', getReportHistory);
router.get('/:id/download', downloadReport);

export default router;