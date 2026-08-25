import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    specialties: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

HospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', HospitalSchema);
