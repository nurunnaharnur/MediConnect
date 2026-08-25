import mongoose from 'mongoose';

const SharedReportSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthReport', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Shared', 'Viewed', 'Diagnosed', 'pending', 'Pending'],
      default: 'Shared',
    },
    sharedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevents duplicate shares of the same report with the same doctor
SharedReportSchema.index({ reportId: 1, doctorId: 1 }, { unique: true });

export default mongoose.model('SharedReport', SharedReportSchema);