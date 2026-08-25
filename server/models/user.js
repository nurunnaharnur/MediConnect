import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  specialization: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  age: { type: Number, default: 0 },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  height: { type: Number, default: 0 }, 
  weight: { type: Number, default: 0 }, 
  medicalHistory: { type: String, default: "" },
  emergencyContact: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);