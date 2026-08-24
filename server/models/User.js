import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  // Existing users have no `role` in the DB; Mongoose applies this default
  // when hydrating them, so every pre-existing account is treated as 'patient'
  // with zero migration needed.
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },

  age: {
    type: Number,
    required: function () { return this.role !== 'doctor'; }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: function () { return this.role !== 'doctor'; }
  },
  height: {
    type: Number,
    required: function () { return this.role !== 'doctor'; }
  },
  weight: {
    type: Number,
    required: function () { return this.role !== 'doctor'; }
  },
  medicalHistory: { type: String, default: "" },

  // Doctor-only fields (ignored for patients)
  specialization: {
    type: String,
    trim: true,
    default: '',
    required: function () { return this.role === 'doctor'; }
  },
  qualification: { type: String, trim: true, default: '' },
  licenseNumber: { type: String, trim: true, default: '' }
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);