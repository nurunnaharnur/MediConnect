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
import healthRoutes from './routes/healthRoutes.js';
import symptomRoutes from './routes/symptomRoutes.js';
import symptomCheckRoutes from './routes/symptomCheckRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import { initReminderScheduler } from './services/notificationService.js';
import { syncAllDoctorUsers } from './services/doctorSyncService.js';

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
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/cycle', cycleRoutes);
app.use('/api/cycles', menstrualCycleRoutes);
app.use('/api/reports', healthReportRoutes);
app.use('/api/symptoms', symptomLogRoutes);
app.use('/api/pcos', pcosRoutes);
app.use('/api/shared-reports', sharedReportRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/symptom-checker', symptomRoutes);
app.use('/api/symptom-check', symptomCheckRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, async () => {
      console.log(`MediConnect ES-Module Server running on port ${PORT}`);
      initReminderScheduler(); // Cron scheduler for medicine reminders
      await syncAllDoctorUsers(); // Sync registered doctors with hospital discovery
    });
  })
  .catch(err => console.error("Database connection failed:", err));