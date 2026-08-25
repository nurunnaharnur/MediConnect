import mongoose from 'mongoose';

const HealthReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diseaseFocus: { type: String, default: 'General Clinical Health' },
    symptoms: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'],
      default: 'Mild',
    },
    summary: { type: String, default: '' },
    designatedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    designatedDoctorName: { type: String, default: '' },
    designatedDoctorSpecialty: { type: String, default: '' },
    vitalsSnapshot: {
      age: Number,
      gender: String,
      height: Number,
      weight: Number,
      bmi: Number,
      medicalHistory: String,
    },
    clinicalDataSnapshot: {
      medications: [mongoose.Schema.Types.Mixed],
      vitals: [mongoose.Schema.Types.Mixed],
      screenings: [mongoose.Schema.Types.Mixed],
      moodLogs: [mongoose.Schema.Types.Mixed],
      cycleInfo: mongoose.Schema.Types.Mixed,
      pcosInfo: mongoose.Schema.Types.Mixed,
      diagnoses: [mongoose.Schema.Types.Mixed],
    },
    sharedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedReport', default: null },
    pdfFileName: { type: String, required: true },
    pdfPath: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('HealthReport', HealthReportSchema);