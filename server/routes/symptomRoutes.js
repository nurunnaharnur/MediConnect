import express from 'express';
import {
  checkSymptoms,
  getSymptomHistory,
  clearSymptomHistory
} from '../controllers/symptomController.js';

const router = express.Router();

// Base: /api/symptoms
router.post('/check', checkSymptoms);
router.get('/history', getSymptomHistory);
router.delete('/history', clearSymptomHistory);

export default router;
