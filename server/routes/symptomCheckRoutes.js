import express from 'express';
import {
  getSymptomOptions,
  runSymptomCheck,
  getSymptomHistory,
  clearSymptomHistory,
} from '../controllers/symptomCheckController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public options route
router.get('/options', getSymptomOptions);

// Authenticated or public fallback routes
router.post('/', (req, res, next) => {
  // Try protect if token exists, otherwise proceed
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, runSymptomCheck);

router.get('/', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getSymptomHistory);

router.delete('/', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, clearSymptomHistory);

export default router;
