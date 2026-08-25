import express from 'express';
import {
  createMoodEntry,
  getMoodEntries,
  getMoodAnalytics,
  deleteMoodEntry
} from '../controllers/moodController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All mood routes are protected by patient JWT authentication
router.use(protect);

router.route('/')
  .post(createMoodEntry)
  .get(getMoodEntries);

router.get('/analytics', getMoodAnalytics);
router.delete('/:id', deleteMoodEntry);

export default router;
