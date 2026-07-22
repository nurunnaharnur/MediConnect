import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true, trim: true },
  department: { type: String, default: '', trim: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "HH:MM"
  reason: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['Booked', 'Rescheduled', 'Cancelled', 'Completed'],
    default: 'Booked'
  }
}, { timestamps: true });

export default mongoose.model('Appointment', AppointmentSchema);
