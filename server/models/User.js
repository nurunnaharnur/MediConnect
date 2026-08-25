import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    // Role: patient or doctor
    role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },

    age: {
      type: Number,
      required: function () {
        return this.role !== 'doctor';
      },
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: function () {
        return this.role !== 'doctor';
      },
    },
    height: {
      type: Number,
      required: function () {
        return this.role !== 'doctor';
      },
    },
    weight: {
      type: Number,
      required: function () {
        return this.role !== 'doctor';
      },
    },
    medicalHistory: { type: String, default: '' },

    emergencyContact: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: 'Family / Guardian' },
    },

    // Doctor-only fields
    specialization: {
      type: String,
      trim: true,
      default: '',
      required: function () {
        return this.role === 'doctor';
      },
    },
    qualification: { type: String, trim: true, default: '' },
    licenseNumber: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, default: 5 },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    hospitalName: { type: String, default: '' },
    bio: { type: String, default: '' },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);
