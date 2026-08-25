import express from 'express';
import {
  getCycleData,
  updateCycleSettings,
  logDailySymptom
} from '../controllers/cycleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getCycleData);
router.put('/settings', updateCycleSettings);
router.post('/log', logDailySymptom);

export default router;
