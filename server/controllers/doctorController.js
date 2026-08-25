import User from '../models/User.js';
import MedicineReminder from '../models/MedicineReminder.js';
import MoodEntry from '../models/MoodEntry.js';
import WellbeingCheckin from '../models/WellbeingCheckin.js';
import Appointment from '../models/Appointment.js';

// @desc    Get List of Patients for Doctor Review
// @route   GET /api/doctor/patients
export const getDoctorPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-password')
      .sort({ createdAt: -1 });

    const patientSummaries = await Promise.all(
      patients.map(async (patient) => {
        // Calculate BMI
        let bmi = null;
        if (patient.height && patient.weight && patient.height > 0) {
          const hm = patient.height / 100;
          bmi = Number((patient.weight / (hm * hm)).toFixed(1));
        }

        // Active Prescriptions count
        const activeMeds = await MedicineReminder.find({
          patientId: patient._id,
          status: 'scheduled'
        });

        // Latest Mood Entry
        const latestMood = await MoodEntry.findOne({ patientId: patient._id })
          .sort({ entryDate: -1 });

        // Latest Mental Well-being Screening
        const latestCheckin = await WellbeingCheckin.findOne({ patientId: patient._id })
          .sort({ completedAt: -1 });

        // Upcoming Appointments
        const nextAppointment = await Appointment.findOne({
          patientId: patient._id,
          status: { $in: ['scheduled', 'Booked', 'Rescheduled'] },
          date: { $gte: new Date() }
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
          latestMood: latestMood ? {
            mood: latestMood.mood,
            score: latestMood.moodScore,
            date: latestMood.entryDate,
            emotions: latestMood.emotions
          } : null,
          latestScreening: latestCheckin ? {
            type: latestCheckin.screeningType,
            score: latestCheckin.totalScore,
            maxScore: latestCheckin.maxScore,
            indication: latestCheckin.indicationLevel,
            date: latestCheckin.completedAt
          } : null,
          nextAppointment: nextAppointment ? {
            _id: nextAppointment._id,
            date: nextAppointment.date,
            time: nextAppointment.time,
            reason: nextAppointment.reason
          } : null
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

    // 1. Prescriptions
    const prescriptions = await MedicineReminder.find({ patientId: patient._id })
      .sort({ createdAt: -1 });

    // 2. Mood Entries & Trend History
    const moodEntries = await MoodEntry.find({ patientId: patient._id })
      .sort({ entryDate: -1 })
      .limit(30);

    // 3. Mental Well-being Screenings History
    const screenings = await WellbeingCheckin.find({ patientId: patient._id })
      .sort({ completedAt: -1 });

    // 4. Appointments History
    const appointments = await Appointment.find({ patientId: patient._id })
      .sort({ date: -1 });

    // Calculate BMI
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
        createdAt: patient.createdAt
      },
      prescriptions,
      moodEntries,
      screenings,
      appointments
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
        { doctorName: { $regex: new RegExp(req.user.name, 'i') } }
      ]
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
// @route   GET /api/doctor (or /api/doctors)
export const listDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select(
      'name email specialization qualification licenseNumber'
    );
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
