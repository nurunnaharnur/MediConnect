import express from 'express';
import { getSymptomHistory } from '../controllers/symptomLogController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSymptomHistory);

export default router;