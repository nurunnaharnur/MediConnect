import express from 'express';
import {
  submitCheckin,
  getCheckinHistory,
  getCheckinAnalytics
} from '../controllers/wellbeingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All wellbeing routes are protected by patient JWT authentication
router.use(protect);

router.post('/checkin', submitCheckin);
router.get('/history', getCheckinHistory);
router.get('/analytics', getCheckinAnalytics);

export default router;
