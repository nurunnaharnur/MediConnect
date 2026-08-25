import express from 'express';
import {
  logMeal,
  getMeals,
  logWorkout,
  getWorkouts,
  logVital,
  getVitals,
  clearHealthLogs
} from '../controllers/healthController.js';

const router = express.Router();

// Base: /api/health
router.post('/meals', logMeal);
router.get('/meals', getMeals);

router.post('/workouts', logWorkout);
router.get('/workouts', getWorkouts);

router.post('/vitals', logVital);
router.get('/vitals', getVitals);

router.delete('/logs', clearHealthLogs);

export default router;
