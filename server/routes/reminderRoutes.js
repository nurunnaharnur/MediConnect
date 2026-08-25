import express from 'express';
import {
  createReminder,
  getReminders,
  getAllReminders,
  getReminderById,
  updateReminderStatus,
  deleteReminder,
  sendTestReminderEmail,
  handleEmailAction,
  getNotificationLogs,
  triggerTestNotification,
  checkDueNotifications
} from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public endpoint for 1-click email actions (secured by JWT action token)
router.get('/email-action', handleEmailAction);

// Notification API routes
router.get('/notifications/logs', getNotificationLogs);
router.post('/notifications/test', triggerTestNotification);
router.get('/notifications/check', checkDueNotifications);

// Protected routes (require Bearer JWT)
router.post('/', protect, createReminder);
router.get('/', protect, getReminders);
router.get('/all', getAllReminders);

router.get('/:id', getReminderById);
router.patch('/:id/status', protect, updateReminderStatus);
router.delete('/:id', protect, deleteReminder);
router.post('/:id/test-email', protect, sendTestReminderEmail);

export default router;
