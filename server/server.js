import 'dotenv/config'; // Loads your environment variables seamlessly in ES Modules
import express from 'express';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import cors from 'cors';




const app = express();
app.use(express.json());

// Bind Sub-Routes
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`MediConnect ES-Module Server running on port ${PORT}`));
  })
  .catch(err => console.error("Database connection failed:", err));