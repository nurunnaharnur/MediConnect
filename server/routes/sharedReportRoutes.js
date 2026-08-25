import express from 'express';
import {
  shareReport,
  getMySharedReports,
  getReportsSharedWithMe,
  getSharedReportById
} from '../controllers/sharedReportController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', shareReport);
router.get('/mine', getMySharedReports);
router.get('/received', requireRole('doctor'), getReportsSharedWithMe);
router.get('/:id', getSharedReportById);

export default router;