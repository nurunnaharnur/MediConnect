import mongoose from 'mongoose';

const SymptomCheckSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    symptoms: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one symptom must be selected.',
      },
    },
    condition: { type: String, required: true },
    specialist: { type: String, required: true },
    severity: {
      type: String,
      enum: ['Low', 'Moderate', 'Urgent'],
      required: true,
    },
    remedies: [
      {
        name: { type: String },
        dosage: { type: String }
      }
    ],
    recommendation: { type: String },
    sensitive: { type: Boolean, default: false },
    matched: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('SymptomCheck', SymptomCheckSchema);
