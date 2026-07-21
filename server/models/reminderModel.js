import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'reminders.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadReminders() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

export function saveReminders(reminders) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2), 'utf-8');
}

export function calculateEndDate(startDateStr, durationDays) {
  const start = new Date(startDateStr);
  const end = new Date(start);
  end.setDate(end.getDate() + parseInt(durationDays, 10));
  return end.toISOString().split('T')[0];
}

export function enrichCourseProgress(reminder) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(reminder.startDate || today);
  start.setHours(0, 0, 0, 0);

  const end = new Date(reminder.endDate || calculateEndDate(reminder.startDate, reminder.durationDays || 7));
  end.setHours(23, 59, 59, 999);

  const durationDays = parseInt(reminder.durationDays, 10) || 7;
  const diffTime = today - start;
  const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const isExpired = today > end || daysPassed > durationDays;
  const daysRemaining = isExpired ? 0 : Math.max(0, durationDays - daysPassed + 1);
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / durationDays) * 100)));

  const computedStatus = isExpired && reminder.status !== 'taken' ? 'expired' : reminder.status;

  return {
    ...reminder,
    endDate: reminder.endDate || calculateEndDate(reminder.startDate, durationDays),
    status: computedStatus,
    daysPassed,
    daysTotal: durationDays,
    daysRemaining,
    progressPercent,
    isExpired
  };
}

export class ReminderModel {
  static getAll() {
    const raw = loadReminders();
    let updated = false;

    const enriched = raw.map(r => {
      const item = enrichCourseProgress(r);
      if (item.status !== r.status) {
        r.status = item.status;
        updated = true;
      }
      return item;
    });

    if (updated) {
      saveReminders(raw);
    }
    return enriched;
  }

  static getById(id) {
    const reminders = ReminderModel.getAll();
    return reminders.find(r => r.id === id);
  }

  static create(data) {
    const reminders = loadReminders();
    const startDate = data.startDate || new Date().toISOString().split('T')[0];
    const durationDays = parseInt(data.durationDays, 10) || 7;
    const endDate = calculateEndDate(startDate, durationDays);

    const newReminder = {
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      medicineName: data.medicineName,
      dosage: data.dosage,
      time: data.time,
      secondTime: data.secondTime || '',
      frequency: data.frequency || 'Daily',
      customDays: Array.isArray(data.customDays) ? data.customDays : [],
      startDate,
      durationDays,
      endDate,
      channels: Array.isArray(data.channels) && data.channels.length > 0 ? data.channels : ['push'],
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      status: 'pending',
      lastNotifiedAt: null,
      createdAt: new Date().toISOString()
    };

    reminders.push(newReminder);
    saveReminders(reminders);
    return enrichCourseProgress(newReminder);
  }

  static updateStatus(id, newStatus, snoozeMinutes = 15) {
    const reminders = loadReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;

    reminders[index].status = newStatus;
    if (newStatus === 'snoozed') {
      const snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
      reminders[index].snoozedUntil = snoozeTime.toISOString();
    } else {
      delete reminders[index].snoozedUntil;
    }
    reminders[index].updatedAt = new Date().toISOString();

    saveReminders(reminders);
    return enrichCourseProgress(reminders[index]);
  }

  static updateNotificationTime(id, isoTimestamp) {
    const reminders = loadReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;

    reminders[index].lastNotifiedAt = isoTimestamp;
    if (reminders[index].status === 'snoozed') {
      reminders[index].status = 'pending';
      delete reminders[index].snoozedUntil;
    }
    reminders[index].updatedAt = isoTimestamp;

    saveReminders(reminders);
    return enrichCourseProgress(reminders[index]);
  }

  static delete(id) {
    const reminders = loadReminders();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return false;

    reminders.splice(index, 1);
    saveReminders(reminders);
    return true;
  }
}
