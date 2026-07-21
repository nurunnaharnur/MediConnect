import express from 'express';
import { createReminder, getReminders, updateReminderStatus } from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createReminder)
  .get(getReminders);

router.patch('/:id/status', updateReminderStatus);

export default router;