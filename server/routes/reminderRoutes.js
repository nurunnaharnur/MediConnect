import express from 'express';
import { 
  createReminder, 
  getReminders, 
  updateReminderStatus, 
  sendTestReminderEmail,
  handleEmailAction
} from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public endpoint for 1-click email actions (secured by JWT action token)
router.get('/email-action', handleEmailAction);

// Protected routes (require Bearer JWT)
router.use(protect);

router.route('/')
  .post(createReminder)
  .get(getReminders);

router.patch('/:id/status', updateReminderStatus);
router.post('/:id/test-email', sendTestReminderEmail);

export default router;