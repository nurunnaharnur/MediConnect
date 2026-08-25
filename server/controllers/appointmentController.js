import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { syncAllDoctorUsers } from '../services/doctorSyncService.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @desc    Book a new appointment
// @route   POST /api/appointments
export const bookAppointment = async (req, res) => {
  const { doctorId, doctorName, doctorSpecialty, department, date, time, reason, type } = req.body;

  if (!date || !time) {
    return res.status(400).json({ message: 'Date and time are required.' });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  try {
    let assignedDoctorId = doctorId && isValidId(doctorId) ? doctorId : null;
    let assignedDoctorName = doctorName || 'Attending Physician';
    let assignedSpecialty = doctorSpecialty || department || 'General Practice';

    if (doctorId && isValidId(doctorId)) {
      const docUser = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (docUser) {
        assignedDoctorName = docUser.name;
        assignedSpecialty = docUser.specialization || assignedSpecialty;
        assignedDoctorId = docUser._id;
      } else {
        const docRecord = await Doctor.findById(doctorId).populate('userId');
        if (docRecord) {
          assignedDoctorName = docRecord.name;
          assignedSpecialty = docRecord.specialty || assignedSpecialty;
          assignedDoctorId = docRecord.userId?._id || docRecord._id;
        }
      }
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      patientName: req.user.name || 'Patient',
      doctorId: assignedDoctorId,
      doctorName: assignedDoctorName,
      doctorSpecialty: assignedSpecialty,
      department: department || assignedSpecialty,
      date: parsedDate,
      time,
      reason: reason || '',
      type: type || 'consultation',
      status: 'scheduled',
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: error.message || 'Failed to book appointment.' });
  }
};

// @desc    Get all appointments for the logged-in patient
// @route   GET /api/appointments
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch appointments.' });
  }
};

export const getPatientAppointments = getAppointments;

// @desc    Reschedule an appointment
// @route   PUT /api/appointments/:id/reschedule
export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid appointment id.' });
  }
  if (!date || !time) {
    return res.status(400).json({ message: 'Date and time are required.' });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format.' });
  }

  try {
    const appointment = await Appointment.findOne({ _id: id, patientId: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    if (appointment.status === 'Cancelled' || appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ message: `Cannot reschedule a ${appointment.status.toLowerCase()} appointment.` });
    }

    appointment.date = parsedDate;
    appointment.time = time;
    appointment.status = 'scheduled';
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: error.message || 'Failed to reschedule appointment.' });
  }
};

// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid appointment id.' });
  }

  try {
    const appointment = await Appointment.findOne({ _id: id, patientId: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found or unauthorized.' });

    if (appointment.status === 'cancelled' || appointment.status === 'Cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled.' });
    }
    if (appointment.status === 'completed' || appointment.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment.' });
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
    await syncAllDoctorUsers();

    const doctors = await Doctor.find()
      .populate('hospitalId', 'name address')
      .populate('userId', 'name email specialization qualification licenseNumber')
      .sort({ rating: -1 });

    const formatted = doctors.map((doc) => ({
      _id: doc.userId?._id || doc._id,
      name: doc.name,
      email: doc.email || doc.userId?.email || '',
      specialization: doc.specialty || doc.userId?.specialization || 'General Practice',
      qualification: doc.userId?.qualification || '',
      licenseNumber: doc.userId?.licenseNumber || '',
      rating: doc.rating,
      hospitalName: doc.hospitalId?.name || 'General Practice Clinic',
      availableSlots: doc.availableSlots,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching doctors list:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch doctors list.' });
  }
};
