import express from 'express';
import {
  createDiagnosis,
  getMyCreatedDiagnoses,
  getMyReceivedDiagnoses,
  getDiagnosesForSharedReport,
  updateDiagnosis
} from '../controllers/diagnosisController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', requireRole('doctor'), createDiagnosis);
router.get('/mine', requireRole('doctor'), getMyCreatedDiagnoses);
router.get('/patient', getMyReceivedDiagnoses);
router.get('/shared/:sharedReportId', requireRole('doctor'), getDiagnosesForSharedReport);
router.put('/:id', requireRole('doctor'), updateDiagnosis);

export default router;