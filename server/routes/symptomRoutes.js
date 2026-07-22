import express from 'express';
import {
  runSymptomCheck,
  getSymptomHistory,
  getSymptomOptions,
} from '../controllers/symptomController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: frontend needs this before the user has necessarily logged in-session
router.get('/options', getSymptomOptions);

// Everything below requires a logged-in patient
router.use(protect);

router.route('/')
  .post(runSymptomCheck)
  .get(getSymptomHistory);

export default router;
