import mongoose from 'mongoose';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import MedicineReminder from '../models/MedicineReminder.js';
import MoodEntry from '../models/MoodEntry.js';
import WellbeingCheckin from '../models/WellbeingCheckin.js';
import Appointment from '../models/Appointment.js';
import { syncAllDoctorUsers, syncDoctorUser } from '../services/doctorSyncService.js';

// @desc    Get List of Patients for Doctor Review
// @route   GET /api/doctor/patients
export const getDoctorPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-password')
      .sort({ createdAt: -1 });

    const patientSummaries = await Promise.all(
      patients.map(async (patient) => {
        let bmi = null;
        if (patient.height && patient.weight && patient.height > 0) {
          const hm = patient.height / 100;
          bmi = Number((patient.weight / (hm * hm)).toFixed(1));
        }

        const activeMeds = await MedicineReminder.find({
          patientId: patient._id,
          status: 'scheduled',
        });

        const latestMood = await MoodEntry.findOne({ patientId: patient._id })
          .sort({ entryDate: -1 });

        const latestCheckin = await WellbeingCheckin.findOne({ patientId: patient._id })
          .sort({ completedAt: -1 });

        const nextAppointment = await Appointment.findOne({
          patientId: patient._id,
          status: { $in: ['scheduled', 'Booked', 'Rescheduled'] },
          date: { $gte: new Date() },
        }).sort({ date: 1 });

        return {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          age: patient.age,
          gender: patient.gender,
          height: patient.height,
          weight: patient.weight,
          bmi,
          medicalHistory: patient.medicalHistory,
          emergencyContact: patient.emergencyContact,
          activePrescriptionsCount: activeMeds.length,
          latestMood: latestMood
            ? {
                mood: latestMood.mood,
                score: latestMood.moodScore,
                date: latestMood.entryDate,
                emotions: latestMood.emotions,
              }
            : null,
          latestScreening: latestCheckin
            ? {
                type: latestCheckin.screeningType,
                score: latestCheckin.totalScore,
                maxScore: latestCheckin.maxScore,
                indication: latestCheckin.indicationLevel,
                date: latestCheckin.completedAt,
              }
            : null,
          nextAppointment: nextAppointment
            ? {
                _id: nextAppointment._id,
                date: nextAppointment.date,
                time: nextAppointment.time,
                reason: nextAppointment.reason,
              }
            : null,
        };
      })
    );

    res.json(patientSummaries);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch patients list.' });
  }
};

// @desc    Get Detailed Clinical Health Record for a Specific Patient
// @route   GET /api/doctor/patient/:id
export const getPatientFullRecord = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    const prescriptions = await MedicineReminder.find({ patientId: patient._id }).sort({ createdAt: -1 });
    const moodEntries = await MoodEntry.find({ patientId: patient._id }).sort({ entryDate: -1 }).limit(30);
    const screenings = await WellbeingCheckin.find({ patientId: patient._id }).sort({ completedAt: -1 });
    const appointments = await Appointment.find({ patientId: patient._id }).sort({ date: -1 });

    let bmi = null;
    if (patient.height && patient.weight && patient.height > 0) {
      const hm = patient.height / 100;
      bmi = Number((patient.weight / (hm * hm)).toFixed(1));
    }

    res.json({
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        height: patient.height,
        weight: patient.weight,
        bmi,
        medicalHistory: patient.medicalHistory,
        emergencyContact: patient.emergencyContact,
        createdAt: patient.createdAt,
      },
      prescriptions,
      moodEntries,
      screenings,
      appointments,
    });
  } catch (error) {
    console.error('Error fetching patient full record:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch patient details.' });
  }
};

// @desc    Get Doctor's Appointments
// @route   GET /api/doctor/appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [
        { doctorId: req.user._id },
        { doctorName: { $regex: new RegExp(req.user.name, 'i') } },
      ],
    }).sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch appointments.' });
  }
};

// @desc    Update Appointment Status & Clinical Notes
// @route   PATCH /api/doctor/appointments/:id
export const updateDoctorAppointment = async (req, res) => {
  const { status, clinicalNotes } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (status) appointment.status = status;
    if (clinicalNotes !== undefined) appointment.clinicalNotes = clinicalNotes;

    await appointment.save();
    res.json({ message: 'Appointment updated successfully.', appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: error.message || 'Failed to update appointment.' });
  }
};

// @desc    List all doctors patients can share reports with / book with
// @route   GET /api/doctor (or /api/doctors/list-all)
export const listDoctors = async (req, res) => {
  try {
    // Ensure all registered doctor accounts have active synced doctor documents
    await syncAllDoctorUsers();

    const doctors = await Doctor.find()
      .populate('hospitalId', 'name address phone')
      .populate('userId', 'name email specialization qualification licenseNumber')
      .sort({ rating: -1 });

    // Format uniform response with deduplication
    const seen = new Set();
    const formatted = [];

    for (const doc of doctors) {
      const key = doc.email ? doc.email.toLowerCase().trim() : (doc.userId?._id?.toString() || doc._id.toString());
      if (!seen.has(key)) {
        seen.add(key);
        formatted.push({
          _id: doc.userId?._id || doc._id,
          doctorId: doc._id,
          userId: doc.userId?._id || null,
          name: doc.name,
          email: doc.email || doc.userId?.email || '',
          specialty: doc.specialty,
          specialization: doc.specialty || doc.userId?.specialization || 'General Physician',
          qualification: doc.userId?.qualification || '',
          licenseNumber: doc.userId?.licenseNumber || '',
          experienceYears: doc.experienceYears,
          rating: doc.rating,
          bio: doc.bio,
          hospitalId: doc.hospitalId?._id || null,
          hospitalName: doc.hospitalId?.name || 'General Practice Clinic',
          availableSlots: doc.availableSlots,
        });
      }
    }

    res.json(formatted);
  } catch (error) {
    console.error('Error listing doctors:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    List practice doctors, optionally filtered by hospital, specialty, and rating (FR-10)
// @route   GET /api/doctors
export const getDoctors = async (req, res) => {
  const { hospitalId, specialty, minRating } = req.query;

  try {
    // Sync any newly registered doctors and cleanup duplicates
    await syncAllDoctorUsers();

    const query = {};
    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({ message: 'Invalid hospitalId.' });
      }
      query.hospitalId = hospitalId;
    }

    if (specialty && specialty.trim()) {
      query.specialty = { $regex: new RegExp(specialty.trim(), 'i') };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const doctors = await Doctor.find(query)
      .populate('hospitalId', 'name address phone')
      .populate('userId', 'name email specialization qualification licenseNumber')
      .sort({ rating: -1 });

    const seen = new Set();
    const formatted = [];

    for (const doc of doctors) {
      const key = doc.email ? doc.email.toLowerCase().trim() : (doc.userId?._id?.toString() || doc._id.toString());
      if (!seen.has(key)) {
        seen.add(key);
        formatted.push({
          _id: doc._id,
          userId: doc.userId?._id || doc._id,
          name: doc.name,
          email: doc.email || doc.userId?.email || '',
          specialty: doc.specialty,
          specialization: doc.specialty,
          experienceYears: doc.experienceYears,
          rating: doc.rating,
          bio: doc.bio,
          hospitalId: doc.hospitalId,
          availableSlots: doc.availableSlots,
        });
      }
    }

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single doctor's full profile & weekly available time slots (FR-11)
// @route   GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor id.' });
    }

    // Try finding by Doctor._id first
    let doctor = await Doctor.findById(id)
      .populate('hospitalId', 'name address phone')
      .populate('userId', 'name email specialization qualification licenseNumber');

    // If not found, try finding by userId
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: id })
        .populate('hospitalId', 'name address phone')
        .populate('userId', 'name email specialization qualification licenseNumber');
    }

    // If still not found, check if it's a User with role: 'doctor' and sync it
    if (!doctor) {
      const user = await User.findOne({ _id: id, role: 'doctor' });
      if (user) {
        const synced = await syncDoctorUser(user);
        if (synced) {
          doctor = await Doctor.findById(synced._id)
            .populate('hospitalId', 'name address phone')
            .populate('userId', 'name email specialization qualification licenseNumber');
        }
      }
    }

    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found.' });

    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor by id:', error);
    res.status(500).json({ message: error.message });
  }
};
