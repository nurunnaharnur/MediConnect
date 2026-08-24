import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import 'dotenv/config'; // Loads your environment variables seamlessly in ES Modules
import express from 'express';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import healthReportRoutes from './routes/healthReportRoutes.js';
import symptomLogRoutes from './routes/symptomLogRoutes.js';
import menstrualCycleRoutes from './routes/menstrualCycleRoutes.js';
import pcosRoutes from './routes/pcosRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import sharedReportRoutes from './routes/sharedReportRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import cors from 'cors';


const app = express();
app.use(express.json());

// Bind Sub-Routes
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', healthReportRoutes);
app.use('/api/symptoms', symptomLogRoutes);
app.use('/api/cycles', menstrualCycleRoutes);
app.use('/api/pcos', pcosRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/shared-reports', sharedReportRoutes);
app.use('/api/diagnoses', diagnosisRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`MediConnect ES-Module Server running on port ${PORT}`));
  })
  .catch(err => console.error("Database connection failed:", err));