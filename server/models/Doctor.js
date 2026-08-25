import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "12:00"
  },
  { _id: false }
);

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    experienceYears: { type: Number, required: true, min: 0 },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    bio: { type: String, default: '' },
    availableSlots: { type: [SlotSchema], default: [] },
  },
  { timestamps: true }
);

DoctorSchema.index({ hospitalId: 1, specialty: 1 });

export default mongoose.model('Doctor', DoctorSchema);
