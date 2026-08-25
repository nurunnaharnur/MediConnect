import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const DiagnosisSchema = new mongoose.Schema(
  {
    sharedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'SharedReport', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    diagnosisNotes: { type: String, required: true, trim: true },
    observations: { type: String, default: '', trim: true },
    recommendations: { type: String, default: '', trim: true },
    medicines: { type: [MedicineSchema], default: [] }
  },
  { timestamps: true }
);

DiagnosisSchema.index({ patientId: 1, createdAt: -1 });
DiagnosisSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model('Diagnosis', DiagnosisSchema);