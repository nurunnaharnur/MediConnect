import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import wellbeingRoutes from './routes/wellbeingRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import cycleRoutes from './routes/cycleRoutes.js';
import healthReportRoutes from './routes/healthReportRoutes.js';
import symptomLogRoutes from './routes/symptomLogRoutes.js';
import menstrualCycleRoutes from './routes/menstrualCycleRoutes.js';
import pcosRoutes from './routes/pcosRoutes.js';
import sharedReportRoutes from './routes/sharedReportRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import { initReminderScheduler } from './services/notificationService.js';

const app = express();
app.use(express.json());
app.use(cors());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/wellbeing', wellbeingRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/cycle', cycleRoutes);
app.use('/api/cycles', menstrualCycleRoutes);
app.use('/api/reports', healthReportRoutes);
app.use('/api/symptoms', symptomLogRoutes);
app.use('/api/pcos', pcosRoutes);
app.use('/api/shared-reports', sharedReportRoutes);
app.use('/api/diagnoses', diagnosisRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`MediConnect ES-Module Server running on port ${PORT}`);
      initReminderScheduler(); // Cron scheduler for medicine reminders
    });
  })
  .catch(err => console.error("Database connection failed:", err));