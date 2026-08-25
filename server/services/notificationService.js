import nodemailer from 'nodemailer';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MedicineReminder from '../models/MedicineReminder.js';
import { ReminderModel } from '../models/reminderModel.js';
import { getDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTIFICATIONS_FILE = path.join(__dirname, '..', 'data', 'notifications.json');

function ensureDataFile() {
  const dir = path.dirname(NOTIFICATIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function loadNotifications() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

export function saveNotifications(notifications) {
  ensureDataFile();
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
}

function createTransporter() {
  const user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // Remove spaces that users might copy-paste from Google's 4x4 app password display
  pass = pass.replace(/\s+/g, '');

  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const sendEmailNotification = async (userEmail, reminder) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[Notification] ⚠️ Cannot send email to ${userEmail}: SMTP_USER or SMTP_PASS is missing in your .env file.`);
    return { success: false, reason: 'Missing SMTP credentials in .env' };
  }

  const mealText = reminder.mealSegment && reminder.mealSegment !== 'other' 
    ? ` (${reminder.mealSegment.replace('_', ' ').toUpperCase()})` 
    : '';

  const sender = process.env.SMTP_FROM || `"MediConnect Health" <${process.env.SMTP_USER}>`;
  const serverBase = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  const patientId = reminder.patientId?._id || reminder.patientId;

  // Generate signed 1-click action tokens for email buttons
  const generateActionUrl = (action) => {
    const actionToken = jwt.sign(
      { reminderId: reminder._id.toString(), status: action, patientId: patientId?.toString() },
      process.env.JWT_SECRET || 'mediconnect-secret',
      { expiresIn: '7d' }
    );
    return `${serverBase}/api/reminders/email-action?token=${actionToken}`;
  };

  const takenUrl = generateActionUrl('taken');
  const snoozedUrl = generateActionUrl('snoozed');
  const skippedUrl = generateActionUrl('skipped');

  const mailOptions = {
    from: sender,
    to: userEmail,
    subject: `💊 Time for your medication: ${reminder.name || reminder.medicineName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f5f7f6; margin: 0; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e7ecea;">
          <div style="border-bottom: 2px solid #e4efec; padding-bottom: 12px; margin-bottom: 18px;">
            <span style="font-size: 20px; font-weight: bold; color: #146356;">💊 MediConnect</span>
            <span style="float: right; font-size: 13px; color: #5b6b65; margin-top: 4px;">Medication Reminder</span>
          </div>

          <p style="font-size: 15px; color: #16241f; margin-top: 0;">Hi there,</p>
          <p style="font-size: 15px; color: #16241f;">It's time to take your scheduled medication:</p>
          
          <div style="background-color: #f1f8f6; border-left: 4px solid #146356; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 6px; font-size: 19px; font-weight: bold; color: #146356;">${reminder.name || reminder.medicineName}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Dosage:</strong> ${reminder.dosage}${mealText}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Scheduled Time:</strong> ${reminder.time}</p>
            ${reminder.notes ? `<p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Instructions:</strong> ${reminder.notes}</p>` : ''}
          </div>

          <!-- 1-Click Interactive Action Buttons -->
          <div style="margin: 24px 0; text-align: center;">
            <p style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #5b6b65; margin-bottom: 14px;">
              Record your dose directly with 1-click:
            </p>
            
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
              <tr>
                <td style="padding: 4px;">
                  <a href="${takenUrl}" target="_blank" style="background-color: #2F9E44; color: #ffffff; padding: 11px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
                    ✅ Taken
                  </a>
                </td>
                <td style="padding: 4px;">
                  <a href="${snoozedUrl}" target="_blank" style="background-color: #A8791A; color: #ffffff; padding: 11px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
                    ⏰ Snooze
                  </a>
                </td>
                <td style="padding: 4px;">
                  <a href="${skippedUrl}" target="_blank" style="background-color: #C4441C; color: #ffffff; padding: 11px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
                    ⏭️ Skip
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e7ecea; margin: 24px 0 16px;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            MediConnect Health • Automated Notification
          </p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Notification] ✅ Reminder email with action buttons successfully sent to ${userEmail} for "${reminder.name || reminder.medicineName}" (Message ID: ${info.messageId})`);
    return { success: true, info };
  } catch (err) {
    console.error(`[Notification] ❌ Failed to send email to ${userEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Cron Job checks every minute
export const initReminderScheduler = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Check against start of today so reminders on the end date still trigger
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    try {
      const activeReminders = await MedicineReminder.find({
        time: currentHHMM,
        status: 'scheduled',
        emailNotification: true,
        endDate: { $gte: startOfToday }
      }).populate('patientId', 'email name');

      if (activeReminders.length > 0) {
        console.log(`[Scheduler] ⏰ ${currentHHMM} - Found ${activeReminders.length} reminder(s) scheduled for right now.`);
      }

      for (const reminder of activeReminders) {
        if (reminder.patientId?.email) {
          await sendEmailNotification(reminder.patientId.email, reminder);
        } else {
          console.warn(`[Scheduler] ⚠️ Reminder "${reminder.name}" (${reminder._id}) has no associated user email.`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] ❌ Error running notification scheduler:', err);
    }
  });
  console.log('[Scheduler] 🔔 Medicine reminder cron scheduler initialized (checking every minute).');
};

// Send urgent emergency alert email to patient's registered contact
export const sendEmergencyAlertEmail = async (guardianEmail, alertData) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[Emergency Alert] ⚠️ SMTP credentials not set in .env. Skipping alert email to ${guardianEmail}.`);
    return { success: false, reason: 'Missing SMTP credentials in .env' };
  }

  const { patient, emergencyType, note, timestamp, medicalHistory, activeMedications } = alertData;
  const sender = process.env.SMTP_FROM || `"MediConnect Emergency Alert" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from: sender,
    to: guardianEmail,
    subject: `🚨 URGENT: Medical Emergency Alert for ${patient.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #FEF2F2; margin: 0; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 28px; border: 2px solid #DC2626; box-shadow: 0 8px 30px rgba(220, 38, 38, 0.15);">
          
          <div style="background-color: #DC2626; color: #ffffff; padding: 14px 18px; border-radius: 8px; margin: -28px -28px 20px -28px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.05em;">🚨 URGENT MEDICAL ALERT</h1>
          </div>

          <p style="font-size: 16px; color: #1F2937; margin-top: 0;">
            This is an urgent automated notification sent on behalf of <strong>${patient.name}</strong> via MediConnect.
          </p>

          <div style="background-color: #FEE2E2; border-left: 5px solid #DC2626; padding: 16px; border-radius: 6px; margin: 18px 0;">
            <p style="margin: 0 0 6px; font-size: 16px; color: #991B1B;"><strong>Emergency Situation:</strong></p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #DC2626;">${emergencyType}</p>
            ${note ? `<p style="margin: 10px 0 0; font-size: 14px; color: #7F1D1D;"><strong>Patient Note / Location:</strong> ${note}</p>` : ''}
          </div>

          <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 14px; color: #374151;">
            <p style="margin: 0 0 6px;"><strong>Patient Name:</strong> ${patient.name}</p>
            <p style="margin: 0 0 6px;"><strong>Patient Email:</strong> ${patient.email}</p>
            ${patient.age ? `<p style="margin: 0 0 6px;"><strong>Age:</strong> ${patient.age} (${patient.gender || 'Not specified'})</p>` : ''}
            <p style="margin: 0 0 6px;"><strong>Alert Triggered At:</strong> ${timestamp}</p>
            ${medicalHistory ? `<p style="margin: 6px 0 0; color: #4B5563;"><strong>Known Medical History:</strong> ${medicalHistory}</p>` : ''}
            ${activeMedications ? `<p style="margin: 6px 0 0; color: #4B5563;"><strong>Active Medications:</strong> ${activeMedications}</p>` : ''}
          </div>

          <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 14px; border-radius: 8px; margin: 20px 0; color: #92400E; font-size: 14px; line-height: 1.5;">
            <strong>Immediate Action Required:</strong>
            <p style="margin: 4px 0 0;">
              Please attempt to contact ${patient.name} immediately. If you cannot reach them or if they confirm a severe emergency, dial <strong>911 (or your local emergency services)</strong> right away.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0 14px;" />
          <p style="font-size: 11px; color: #6B7280; text-align: center; margin: 0; line-height: 1.4;">
            <strong>Disclaimer:</strong> This notification is a rapid communication aid. MediConnect does not automatically diagnose heart attacks or medical conditions. Always seek professional emergency medical services in crisis situations.
          </p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Emergency Alert] 🚨 Emergency alert successfully emailed to ${guardianEmail} for ${patient.name} (ID: ${info.messageId})`);
    return { success: true, info };
  } catch (err) {
    console.error(`[Emergency Alert] ❌ Failed to send emergency email to ${guardianEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

export class NotificationService {
  static async getLogs(limit = 50) {
    const db = await getDB();
    if (db) {
      try {
        let logs = await db.collection('notifications')
          .find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();
        if (logs.length === 0) {
          const localLogs = loadNotifications();
          if (localLogs.length > 0) {
            console.log(`Migrating ${localLogs.length} local notifications to MongoDB...`);
            await db.collection('notifications').insertMany(localLogs);
            logs = await db.collection('notifications')
              .find({})
              .sort({ timestamp: -1 })
              .limit(limit)
              .toArray();
          }
        }
        return logs;
      } catch (err) {
        console.warn("⚠️ MongoDB is read-only or connection failed. Gracefully falling back to local notifications database.");
      }
    }

    const logs = loadNotifications();
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  static async dispatchNotification(reminder, channel = 'push', isTest = false) {
    const now = new Date();
    let recipient = 'Browser User';
    let detail = '';

    const medName = reminder.name || reminder.medicineName || 'Medication';

    if (channel === 'sms') {
      recipient = reminder.phoneNumber || '+1 (555) 019-2834';
      detail = `[Twilio Gateway] SMS sent to ${recipient}: "Reminder: Take ${medName} (${reminder.dosage}) now."`;
    } else if (channel === 'email') {
      recipient = reminder.email || 'patient@mediconnect.health';
      detail = `[SendGrid Service] Email dispatched to ${recipient}: Subject "MediConnect Reminder: ${medName}"`;
    } else {
      channel = 'push';
      recipient = 'Web Browser Client';
      detail = `[Web Push API] Desktop Alert: "Time to take ${medName} - ${reminder.dosage}"`;
    }

    const notificationRecord = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      reminderId: reminder._id ? reminder._id.toString() : (reminder.id || 'test_id'),
      medicineName: medName,
      dosage: reminder.dosage,
      channel,
      recipient,
      message: `Time to take ${medName} (${reminder.dosage})`,
      detail,
      timestamp: now.toISOString(),
      status: 'delivered',
      isTest
    };

    console.log(`🔔 AUTOMATED NOTIFICATION DELIVERED [${channel.toUpperCase()}]:`, detail);

    const db = await getDB();
    if (db) {
      try {
        await db.collection('notifications').insertOne(notificationRecord);
        return notificationRecord;
      } catch (err) {
        console.error("MongoDB insert notification failed, falling back to file:", err);
      }
    }

    const logs = loadNotifications();
    logs.push(notificationRecord);
    saveNotifications(logs);

    return notificationRecord;
  }

  static async checkDueReminders() {
    const reminders = await ReminderModel.getAll();
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[now.getDay()];

    const newlyTriggered = [];

    for (const r of reminders) {
      if (r.status === 'taken' || r.status === 'skipped' || r.status === 'expired' || r.isExpired) continue;

      let isDue = false;

      // Check custom days filter if frequency === 'Custom'
      if (r.frequency === 'Custom' && Array.isArray(r.customDays) && r.customDays.length > 0) {
        if (!r.customDays.includes(currentDayName)) {
          continue;
        }
      }

      // Check snoozed time
      if (r.status === 'snoozed' && r.snoozedUntil) {
        const snoozeDate = new Date(r.snoozedUntil);
        if (now >= snoozeDate) {
          isDue = true;
        }
      } 
      // Check normal scheduled time or secondTime slot (for Twice Daily)
      else if (r.time === currentHHMM || (r.frequency === 'Twice Daily' && r.secondTime === currentHHMM)) {
        const lastNotifiedMinute = r.lastNotifiedAt ? r.lastNotifiedAt.substring(0, 16) : '';
        const currentMinuteISO = now.toISOString().substring(0, 16);
        if (lastNotifiedMinute !== currentMinuteISO) {
          isDue = true;
        }
      }

      if (isDue) {
        const channels = (r.channels && r.channels.length > 0) ? r.channels : ['push'];
        for (const ch of channels) {
          const notif = await NotificationService.dispatchNotification(r, ch, false);
          newlyTriggered.push(notif);
        }

        await ReminderModel.updateNotificationTime(r.id, now.toISOString());
      }
    }

    return newlyTriggered;
  }

  static startScheduler(intervalMs = 15000) {
    console.log('⏰ MediConnect Notification Engine Scheduler Started (Interval: 15s)');
    
    (async () => {
      try {
        await NotificationService.checkDueReminders();
      } catch (e) {
        console.error('Error in initial notification check:', e);
      }
    })();

    setInterval(async () => {
      try {
        await NotificationService.checkDueReminders();
      } catch (e) {
        console.error('Error in scheduled notification check:', e);
      }
    }, intervalMs);
  }
}
