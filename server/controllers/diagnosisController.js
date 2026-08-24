import mongoose from 'mongoose';
import Diagnosis from '../models/Diagnosis.js';
import SharedReport from '../models/SharedReport.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sanitizeMedicines(medicines) {
  if (!Array.isArray(medicines)) return [];
  return medicines
    .filter((m) => m && m.name && m.dosage && m.frequency && m.duration)
    .map((m) => ({
      name: m.name.trim(),
      dosage: m.dosage.trim(),
      frequency: m.frequency.trim(),
      duration: m.duration.trim(),
      instructions: (m.instructions || '').trim()
    }));
}

// @desc    Create a diagnosis + prescription for a shared report
// @route   POST /api/diagnoses
export const createDiagnosis = async (req, res) => {
  const { sharedReportId, diagnosisNotes, observations, recommendations, medicines } = req.body;

  if (!sharedReportId || !isValidId(sharedReportId)) {
    return res.status(400).json({ message: 'A valid sharedReportId is required' });
  }
  if (!diagnosisNotes || !diagnosisNotes.trim()) {
    return res.status(400).json({ message: 'diagnosisNotes is required' });
  }

  try {
    const sharedReport = await SharedReport.findById(sharedReportId);
    if (!sharedReport) {
      return res.status(404).json({ message: 'Shared report not found' });
    }
    // A doctor may only diagnose reports that were explicitly shared with them.
    if (sharedReport.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This report was not shared with you' });
    }

    const diagnosis = await Diagnosis.create({
      sharedReportId,
      doctorId: req.user._id,
      patientId: sharedReport.patientId,
      diagnosisNotes,
      observations: observations || '',
      recommendations: recommendations || '',
      medicines: sanitizeMedicines(medicines)
    });

    res.status(201).json(diagnosis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get diagnoses created by the logged-in doctor
// @route   GET /api/diagnoses/mine
export const getMyCreatedDiagnoses = async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find({ doctorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('patientId', 'name email');
    res.json(diagnoses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get diagnoses received by the logged-in patient
// @route   GET /api/diagnoses/patient
export const getMyReceivedDiagnoses = async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'name email specialization');
    res.json(diagnoses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get diagnoses tied to one shared report (only the doctor who owns that share)
// @route   GET /api/diagnoses/shared/:sharedReportId
export const getDiagnosesForSharedReport = async (req, res) => {
  const { sharedReportId } = req.params;
  if (!isValidId(sharedReportId)) {
    return res.status(400).json({ message: 'Invalid sharedReportId' });
  }

  try {
    const sharedReport = await SharedReport.findById(sharedReportId);
    if (!sharedReport) return res.status(404).json({ message: 'Shared report not found' });
    if (sharedReport.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This report was not shared with you' });
    }

    const diagnoses = await Diagnosis.find({ sharedReportId }).sort({ createdAt: -1 });
    res.json(diagnoses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a diagnosis/prescription the logged-in doctor created
// @route   PUT /api/diagnoses/:id
export const updateDiagnosis = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid diagnosis id' });
  }

  const { diagnosisNotes, observations, recommendations, medicines } = req.body;

  try {
    const diagnosis = await Diagnosis.findOne({ _id: id, doctorId: req.user._id });
    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis record not found' });
    }

    if (diagnosisNotes !== undefined) {
      if (!diagnosisNotes.trim()) {
        return res.status(400).json({ message: 'diagnosisNotes cannot be empty' });
      }
      diagnosis.diagnosisNotes = diagnosisNotes;
    }
    if (observations !== undefined) diagnosis.observations = observations;
    if (recommendations !== undefined) diagnosis.recommendations = recommendations;
    if (medicines !== undefined) diagnosis.medicines = sanitizeMedicines(medicines);

    await diagnosis.save();
    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};