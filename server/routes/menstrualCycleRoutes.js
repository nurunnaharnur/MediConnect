import express from 'express';
import {
  createCycle,
  getCycles,
  getCyclePrediction,
  updateCycle,
  deleteCycle
} from '../controllers/menstrualCycleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// NOTE: /prediction must be declared before /:id so Express doesn't treat
// "prediction" as an :id parameter.
router.get('/prediction', getCyclePrediction);

router.route('/')
  .post(createCycle)
  .get(getCycles);

router.route('/:id')
  .put(updateCycle)
  .delete(deleteCycle);

export default router;