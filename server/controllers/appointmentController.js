import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @desc    Book a new appointment
// @route   POST /api/appointments
export const bookAppointment = async (req, res) => {
  const { doctorName, department, date, time, reason } = req.body;

  if (!doctorName || !date || !time) {
    return res.status(400).json({ message: 'doctorName, date and time are required' });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorName,
      department,
      date: parsedDate,
      time,
      reason
    });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments for the logged-in patient
// @route   GET /api/appointments
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id }).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule an appointment
// @route   PUT /api/appointments/:id/reschedule
export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid appointment id' });
  }
  if (!date || !time) {
    return res.status(400).json({ message: 'date and time are required' });
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  try {
    const appointment = await Appointment.findOne({ _id: id, patientId: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      return res.status(400).json({ message: `Cannot reschedule a ${appointment.status.toLowerCase()} appointment` });
    }

    appointment.date = parsedDate;
    appointment.time = time;
    appointment.status = 'Rescheduled';
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel an appointment (soft delete via status)
// @route   PUT /api/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid appointment id' });
  }

  try {
    const appointment = await Appointment.findOne({ _id: id, patientId: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }
    if (appointment.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};