import { ReminderModel } from '../models/reminderModel.js';
import { NotificationService } from '../services/notificationService.js';

export async function createReminder(req, res) {
  try {
    const { medicineName, dosage, time, secondTime, frequency, customDays, startDate, durationDays, channels, phoneNumber, email } = req.body;

    if (!medicineName || !medicineName.trim()) {
      return res.status(400).json({ error: 'Medicine name is required.' });
    }
    if (!dosage || !dosage.trim()) {
      return res.status(400).json({ error: 'Dosage information is required.' });
    }
    if (!time || !time.trim()) {
      return res.status(400).json({ error: 'Reminder time is required.' });
    }

    const newReminder = ReminderModel.create({
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      time: time.trim(),
      secondTime: secondTime ? secondTime.trim() : '',
      frequency: frequency || 'Daily',
      customDays: Array.isArray(customDays) ? customDays : [],
      startDate: startDate || new Date().toISOString().split('T')[0],
      durationDays: durationDays || 7,
      channels: Array.isArray(channels) && channels.length > 0 ? channels : ['push'],
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      email: email ? email.trim() : ''
    });

    return res.status(201).json({
      message: 'Medicine reminder created successfully!',
      reminder: newReminder
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return res.status(500).json({ error: 'Failed to create medicine reminder.' });
  }
}

export async function getAllReminders(req, res) {
  try {
    const reminders = ReminderModel.getAll();
    return res.status(200).json({
      count: reminders.length,
      reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return res.status(500).json({ error: 'Failed to fetch medicine reminders.' });
  }
}

export async function getReminderById(req, res) {
  try {
    const { id } = req.params;
    const reminder = ReminderModel.getById(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Medicine reminder not found.' });
    }
    return res.status(200).json({ reminder });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return res.status(500).json({ error: 'Failed to fetch medicine reminder.' });
  }
}

export async function updateReminderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, snoozeMinutes } = req.body;

    const validStatuses = ['pending', 'taken', 'skipped', 'snoozed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = ReminderModel.updateStatus(id, status, snoozeMinutes || 15);
    if (!updated) {
      return res.status(404).json({ error: 'Medicine reminder not found.' });
    }

    return res.status(200).json({
      message: `Reminder status updated to '${status}'.`,
      reminder: updated
    });
  } catch (error) {
    console.error('Error updating reminder status:', error);
    return res.status(500).json({ error: 'Failed to update reminder status.' });
  }
}

export async function deleteReminder(req, res) {
  try {
    const { id } = req.params;
    const deleted = ReminderModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Medicine reminder not found.' });
    }
    return res.status(200).json({ message: 'Medicine reminder deleted successfully.' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return res.status(500).json({ error: 'Failed to delete medicine reminder.' });
  }
}

export async function getNotificationLogs(req, res) {
  try {
    const logs = NotificationService.getLogs();
    return res.status(200).json({ count: logs.length, logs });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    return res.status(500).json({ error: 'Failed to fetch notification logs.' });
  }
}

export async function triggerTestNotification(req, res) {
  try {
    const { reminderId, channel, customMessage } = req.body;
    let reminder = null;

    if (reminderId) {
      reminder = ReminderModel.getById(reminderId);
    }

    if (!reminder) {
      // Use sample reminder if not found
      reminder = {
        id: 'test_sample',
        medicineName: 'Paracetamol 500mg',
        dosage: '1 Tablet after meal',
        phoneNumber: req.body.phoneNumber || '+1 (555) 019-2834',
        email: req.body.email || 'patient@mediconnect.health'
      };
    }

    const channelsToTrigger = channel ? [channel] : (reminder.channels || ['push', 'sms', 'email']);
    const results = channelsToTrigger.map(ch => NotificationService.dispatchNotification(reminder, ch, true));

    return res.status(200).json({
      message: 'Test notification triggered successfully!',
      triggered: results
    });
  } catch (error) {
    console.error('Error triggering test notification:', error);
    return res.status(500).json({ error: 'Failed to trigger test notification.' });
  }
}

export async function checkDueNotifications(req, res) {
  try {
    const newlyTriggered = NotificationService.checkDueReminders();
    const logs = NotificationService.getLogs(20);
    return res.status(200).json({
      newCount: newlyTriggered.length,
      newlyTriggered,
      recentLogs: logs
    });
  } catch (error) {
    console.error('Error checking due notifications:', error);
    return res.status(500).json({ error: 'Failed to check due notifications.' });
  }
}

