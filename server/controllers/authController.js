import User from '../models/User.js';
import MedicineReminder from '../models/MedicineReminder.js';
import MoodEntry from '../models/MoodEntry.js';
import WellbeingCheckin from '../models/WellbeingCheckin.js';
import CycleEntry from '../models/CycleEntry.js';
import Appointment from '../models/Appointment.js';
import Diagnosis from '../models/Diagnosis.js';
import jwt from 'jsonwebtoken';
import { generatePersonalizedTips } from '../services/tipsService.js';
import { sendEmergencyAlertEmail } from '../services/notificationService.js';
import { streamComprehensiveHealthProfilePDF } from '../utils/pdfGenerator.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mediconnect-secret', { expiresIn: '30d' });
};

// Formats user object for frontend session
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || 'patient',
  specialization: user.specialization || '',
  qualification: user.qualification || '',
  licenseNumber: user.licenseNumber || '',
  age: user.age || 0,
  gender: user.gender || '',
  height: user.height || 0,
  weight: user.weight || 0,
  medicalHistory: user.medicalHistory || '',
  emergencyContact: user.emergencyContact || { name: '', email: '', phone: '', relationship: '' },
  token: generateToken(user._id)
});

// @desc    Register a Patient or a Doctor
// @route   POST /api/auth/register
export const register = async (req, res) => {
  const {
    name,
    email,
    password,
    age,
    gender,
    height,
    weight,
    medicalHistory,
    role,
    specialization,
    qualification,
    licenseNumber,
    emergencyContact
  } = req.body;

  const finalRole = (role === 'doctor') ? 'doctor' : 'patient';

  if (finalRole === 'doctor' && (!specialization || !specialization.trim())) {
    return res.status(400).json({ message: 'Specialization is required to register as a doctor.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email is already registered.' });

    const userData = {
      name,
      email,
      password,
      role: finalRole
    };

    if (finalRole === 'doctor') {
      userData.specialization = specialization;
      userData.qualification = qualification || '';
      userData.licenseNumber = licenseNumber || '';
    } else {
      userData.age = age || 0;
      userData.gender = gender || 'Other';
      userData.height = height || 0;
      userData.weight = weight || 0;
      userData.medicalHistory = medicalHistory || '';
      userData.emergencyContact = emergencyContact || { name: '', email: '', phone: '', relationship: '' };
    }

    const user = await User.create(userData);
    res.status(201).json(formatUserResponse(user));
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Failed to register account.' });
  }
};

// @desc    Register Doctor
// @route   POST /api/auth/doctor-register
export const doctorRegister = async (req, res) => {
  const { name, email, password, specialization, qualification, licenseNumber } = req.body;

  try {
    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ message: 'Name, email, password, and specialization are required.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email is already registered.' });

    const doctor = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      specialization,
      qualification: qualification || '',
      licenseNumber: licenseNumber || ''
    });

    res.status(201).json(formatUserResponse(doctor));
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ message: error.message || 'Failed to register doctor account.' });
  }
};

// @desc    Authenticate Patient or Doctor
// @route   POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json(formatUserResponse(user));
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Failed to sign in.' });
  }
};

// @desc    Authenticate Doctor
// @route   POST /api/auth/doctor-login
export const doctorLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid doctor credentials.' });
    }

    if (user.role !== 'doctor') {
      return res.status(403).json({
        message: 'This account is not registered as a healthcare provider. Please use the Patient Login.'
      });
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ message: error.message || 'Failed to sign in as doctor.' });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User profile not found.' });
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Emergency Contact
// @route   PUT /api/auth/emergency-contact
export const updateEmergencyContact = async (req, res) => {
  const { name, email, phone, relationship } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.emergencyContact = {
      name: name !== undefined ? name : user.emergencyContact?.name || '',
      email: email !== undefined ? email : user.emergencyContact?.email || '',
      phone: phone !== undefined ? phone : user.emergencyContact?.phone || '',
      relationship: relationship !== undefined ? relationship : user.emergencyContact?.relationship || ''
    };

    await user.save();
    res.json({
      message: 'Emergency contact updated successfully.',
      emergencyContact: user.emergencyContact
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ message: error.message || 'Failed to update emergency contact.' });
  }
};

// @desc    Send Emergency Alert to Guardian
// @route   POST /api/auth/emergency-alert
export const sendEmergencyAlert = async (req, res) => {
  const { emergencyType, note } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const guardianEmail = user.emergencyContact?.email;
    if (!guardianEmail) {
      return res.status(400).json({
        message: 'No emergency contact email is registered. Please save an emergency contact first.'
      });
    }

    // Fetch active medications to include in the emergency alert summary
    const activeMeds = await MedicineReminder.find({
      patientId: user._id,
      status: 'scheduled'
    });

    const activeMedsSummary = activeMeds.map((m) => `${m.name} (${m.dosage})`).join(', ') || 'None reported';

    const nowFormatted = new Date().toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const alertPayload = {
      patient: {
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender
      },
      emergencyType: emergencyType || 'Urgent Medical Emergency',
      note: note || '',
      timestamp: nowFormatted,
      medicalHistory: user.medicalHistory || 'None reported',
      activeMedications: activeMedsSummary
    };

    const emailResult = await sendEmergencyAlertEmail(guardianEmail, alertPayload);

    if (!emailResult.success) {
      return res.status(400).json({
        message: `Alert generated, but email delivery failed: ${emailResult.reason || emailResult.error || 'Check SMTP configuration'}`
      });
    }

    res.json({
      message: `🚨 Emergency alert dispatched successfully to ${guardianEmail}.`,
      sentTo: guardianEmail,
      timestamp: nowFormatted
    });
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    res.status(500).json({ message: error.message || 'Failed to dispatch emergency alert.' });
  }
};

// @desc    Get Personalized Educational Health Tips
// @route   GET /api/auth/health-tips
export const getHealthTips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const tipsResult = await generatePersonalizedTips(user);
    res.json(tipsResult);
  } catch (error) {
    console.error('Error generating health tips:', error);
    res.status(500).json({ message: error.message || 'Failed to generate personalized health tips.' });
  }
};

// @desc    Generate & Stream Comprehensive Patient Health Profile PDF
// @route   GET /api/auth/health-profile/pdf
export const exportComprehensiveHealthProfilePDF = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Patient profile not found.' });

    // Parallel fetch of all patient records
    const [medications, moodEntries, screenings, cycleRecord, appointments, diagnoses] = await Promise.all([
      MedicineReminder.find({ patientId: user._id }).sort({ createdAt: -1 }),
      MoodEntry.find({ patientId: user._id }).sort({ entryDate: -1 }).limit(10),
      WellbeingCheckin.find({ patientId: user._id }).sort({ completedAt: -1 }).limit(10),
      CycleEntry.findOne({ patientId: user._id }),
      Appointment.find({ patientId: user._id }).sort({ date: -1 }),
      Diagnosis.find({ patientId: user._id }).sort({ createdAt: -1 })
    ]);

    // Compute cycle metrics if cycle record exists
    let cycleData = null;
    if (cycleRecord) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(cycleRecord.lastPeriodStart);
      start.setHours(0, 0, 0, 0);
      const diffDays = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
      const cycleLength = cycleRecord.cycleLength || 28;
      const periodDuration = cycleRecord.periodDuration || 5;
      const currentCycleDay = (diffDays % cycleLength) + 1;
      const nextPeriodMs = start.getTime() + (Math.floor(diffDays / cycleLength) + 1) * cycleLength * 86400000;
      const nextPeriodDate = new Date(nextPeriodMs);
      const daysUntilNext = Math.max(0, Math.ceil((nextPeriodDate - today) / 86400000));

      let phase = 'Follicular Phase';
      if (currentCycleDay <= periodDuration) phase = 'Menstrual Phase';
      else if (currentCycleDay >= cycleLength - 14 - 5 && currentCycleDay <= cycleLength - 14 + 1) phase = 'Ovulation Window';
      else if (currentCycleDay > cycleLength - 14 + 1) phase = 'Luteal Phase';

      cycleData = {
        phase,
        currentCycleDay,
        cycleLength,
        periodDuration,
        nextPeriodDate,
        daysUntilNext
      };
    }

    const sanitizedFileName = `MediConnect_Health_Profile_${user.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"`);

    streamComprehensiveHealthProfilePDF(
      {
        user,
        medications,
        moodEntries,
        screenings,
        cycleData,
        appointments,
        diagnoses,
        generatedAt: new Date()
      },
      res
    );
  } catch (error) {
    console.error('Error generating full health profile PDF:', error);
    res.status(500).json({ message: error.message || 'Failed to generate health profile PDF.' });
  }
};