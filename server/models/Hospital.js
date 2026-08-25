import mongoose from 'mongoose';

// FR-9: hospitals need a proper geospatial point so MongoDB can answer
// "which of these are near this patient?" efficiently. GeoJSON coordinates
// are ALWAYS [longitude, latitude] — reversed from how people normally say
// lat/lng out loud, which is the #1 source of bugs here.
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
    // Specialties available at this hospital — powers FR-10's specialty filter
    specialties: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

// Required for $geoNear / $near geospatial queries (FR-9, FR-10)
HospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', HospitalSchema);
