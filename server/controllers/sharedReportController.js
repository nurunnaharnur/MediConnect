import mongoose from 'mongoose';
import SharedReport from '../models/SharedReport.js';
import HealthReport from '../models/HealthReport.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @desc    Share one of the patient's own health reports with a doctor
// @route   POST /api/shared-reports
export const shareReport = async (req, res) => {
  const { reportId, doctorId, appointmentId } = req.body;

  if (!reportId || !isValidId(reportId)) {
    return res.status(400).json({ message: 'A valid reportId is required' });
  }
  if (!doctorId || !isValidId(doctorId)) {
    return res.status(400).json({ message: 'A valid doctorId is required' });
  }

  try {
    // Only the owner of a health report can share it.
    const report = await HealthReport.findOne({ _id: reportId, patientId: req.user._id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found, or you do not own this report' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    let appointment = null;
    if (appointmentId) {
      if (!isValidId(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointmentId' });
      }
      appointment = await Appointment.findOne({ _id: appointmentId, patientId: req.user._id });
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found, or you do not own this appointment' });
      }
    }

    const sharedReport = await SharedReport.create({
      reportId,
      patientId: req.user._id,
      doctorId,
      appointmentId: appointment ? appointment._id : null
    });

    res.status(201).json(sharedReport);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This report has already been shared with this doctor' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reports the logged-in patient has shared
// @route   GET /api/shared-reports/mine
export const getMySharedReports = async (req, res) => {
  try {
    const shared = await SharedReport.find({ patientId: req.user._id })
      .sort({ sharedAt: -1 })
      .populate('reportId', 'symptoms severity generatedAt pdfFileName')
      .populate('doctorId', 'name email specialization');
    res.json(shared);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reports shared with the logged-in doctor
// @route   GET /api/shared-reports/received
export const getReportsSharedWithMe = async (req, res) => {
  try {
    const shared = await SharedReport.find({ doctorId: req.user._id })
      .sort({ sharedAt: -1 })
      .populate('reportId', 'symptoms severity generatedAt pdfFileName vitalsSnapshot')
      .populate('patientId', 'name email age gender medicalHistory');
    res.json(shared);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single shared report (owner patient or assigned doctor only)
// @route   GET /api/shared-reports/:id
export const getSharedReportById = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid shared report id' });
  }

  try {
    const shared = await SharedReport.findById(id)
      .populate('reportId', 'symptoms severity generatedAt pdfFileName vitalsSnapshot')
      .populate('patientId', 'name email age gender medicalHistory')
      .populate('doctorId', 'name email specialization');

    if (!shared) return res.status(404).json({ message: 'Shared report not found' });

    const isOwnerPatient = shared.patientId._id.toString() === req.user._id.toString();
    const isAssignedDoctor = shared.doctorId._id.toString() === req.user._id.toString();

    if (!isOwnerPatient && !isAssignedDoctor) {
      return res.status(403).json({ message: 'You are not authorized to view this shared report' });
    }

    if (isAssignedDoctor && shared.status === 'Shared') {
      shared.status = 'Viewed';
      await shared.save();
    }

    res.json(shared);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};