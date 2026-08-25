import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// @desc    Book a new appointment
// @route   POST /api/appointments
export const bookAppointment = async (req, res) => {
  const { doctorId, doctorName, doctorSpecialty, date, time, reason, type } = req.body;

  try {
    if (!date || !time || !reason) {
      return res.status(400).json({ message: 'Date, time, and reason are required.' });
    }

    let assignedDoctorId = doctorId;
    let assignedDoctorName = doctorName || 'Dr. Sarah Jenkins, MD';
    let assignedSpecialty = doctorSpecialty || 'General Medicine';

    // If doctorId is provided, look up doctor
    if (doctorId) {
      const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (doctor) {
        assignedDoctorName = doctor.name;
        assignedSpecialty = doctor.specialization || 'General Practice';
      }
    } else {
      // Find any registered doctor or assign default
      const defaultDoc = await User.findOne({ role: 'doctor' });
      if (defaultDoc) {
        assignedDoctorId = defaultDoc._id;
        assignedDoctorName = defaultDoc.name;
        assignedSpecialty = defaultDoc.specialization || 'General Practice';
      } else {
        assignedDoctorId = req.user._id; // fallback
      }
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      patientName: req.user.name,
      doctorId: assignedDoctorId,
      doctorName: assignedDoctorName,
      doctorSpecialty: assignedSpecialty,
      date: new Date(date),
      time,
      reason,
      type: type || 'consultation',
      status: 'scheduled'
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: error.message || 'Failed to book appointment.' });
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch appointments.' });
  }
};

// @desc    Cancel appointment
// @route   PATCH /api/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: error.message || 'Failed to cancel appointment.' });
  }
};

// @desc    Get list of available doctors for booking
// @route   GET /api/appointments/doctors
export const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('_id name email specialization licenseNumber');
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors list:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch doctors list.' });
  }
};
