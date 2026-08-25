import mongoose from 'mongoose';
import path from 'path';
import HealthReport from '../models/HealthReport.js';
import SymptomLog from '../models/SymptomLog.js';
import SharedReport from '../models/SharedReport.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import MedicineReminder from '../models/MedicineReminder.js';
import MoodEntry from '../models/MoodEntry.js';
import WellbeingCheckin from '../models/WellbeingCheckin.js';
import PcosProfile from '../models/PcosProfile.js';
import MenstrualCycle from '../models/MenstrualCycle.js';
import Diagnosis from '../models/Diagnosis.js';
import { VitalsModel } from '../models/vitalsModel.js';
import { generateHealthReportPDF, REPORTS_DIR } from '../utils/pdfGenerator.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @desc    Generate a disease-focused health report and optionally share exclusively with designated doctor
// @route   POST /api/reports/generate
export const generateReport = async (req, res) => {
  const {
    symptoms,
    severity,
    diseaseFocus = 'General Clinical Health',
    targetDoctorId = null,
    clinicalNotes = ''
  } = req.body;

  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ message: 'Symptoms description is required.' });
  }
  const allowedSeverity = ['Mild', 'Moderate', 'Severe'];
  const finalSeverity = allowedSeverity.includes(severity) ? severity : 'Mild';

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Patient profile not found.' });

    // Look up designated doctor if specified
    let designatedDoctor = null;
    if (targetDoctorId && isValidId(targetDoctorId)) {
      designatedDoctor = await User.findOne({ _id: targetDoctorId, role: 'doctor' }) ||
                         await Doctor.findById(targetDoctorId);
    }

    // Gather all related patient data
    const [
      medications,
      moodEntries,
      screenings,
      pcosRecord,
      latestCycle,
      diagnoses,
      vitalsList
    ] = await Promise.all([
      MedicineReminder.find({ patientId: user._id }).sort({ createdAt: -1 }).limit(10).catch(() => []),
      MoodEntry.find({ patientId: user._id }).sort({ entryDate: -1 }).limit(10).catch(() => []),
      WellbeingCheckin.find({ patientId: user._id }).sort({ completedAt: -1 }).limit(6).catch(() => []),
      PcosProfile.findOne({ patientId: user._id }).catch(() => null),
      MenstrualCycle.findOne({ patientId: user._id }).sort({ startDate: -1 }).catch(() => null),
      Diagnosis.find({ patientId: user._id }).sort({ createdAt: -1 }).limit(6).catch(() => []),
      VitalsModel.getRecent(5).catch(() => []),
    ]);

    const generatedAt = new Date();

    // Calculate BMI
    let bmiVal = null;
    if (user.height && user.weight && user.height > 0) {
      const hm = user.height / 100;
      bmiVal = Number((user.weight / (hm * hm)).toFixed(1));
    }

    const clinicalSnapshot = {
      medications: medications.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, status: m.status })),
      vitals: vitalsList.map(v => ({ systolic: v.systolic, diastolic: v.diastolic, pulse: v.pulse, status: v.status, loggedAt: v.loggedAt })),
      screenings: screenings.map(s => ({ type: s.screeningType, score: s.totalScore, max: s.maxScore, indication: s.indicationLevel })),
      moodLogs: moodEntries.map(m => ({ mood: m.mood, score: m.moodScore, date: m.entryDate })),
      cycleInfo: latestCycle ? { phase: latestCycle.phase, cycleLength: latestCycle.cycleLength, currentDay: latestCycle.currentCycleDay } : null,
      pcosInfo: pcosRecord ? { riskLevel: pcosRecord.screeningResult?.riskLevel, patterns: pcosRecord.screeningResult?.matchedPatterns } : null,
      diagnoses: diagnoses.map(d => ({ notes: d.diagnosisNotes, recs: d.recommendations })),
    };

    // Generate Targeted PDF
    const { fileName, relativePath } = await generateHealthReportPDF({
      user,
      symptoms,
      severity: finalSeverity,
      diseaseFocus,
      designatedDoctor,
      medications,
      vitals: vitalsList,
      screenings,
      moodEntries,
      cycleInfo: latestCycle,
      pcosInfo: pcosRecord,
      diagnoses,
      generatedAt
    });

    // Save HealthReport Record
    const report = await HealthReport.create({
      patientId: user._id,
      diseaseFocus,
      symptoms,
      severity: finalSeverity,
      summary: `Clinical Report for ${diseaseFocus} generated on ${generatedAt.toLocaleDateString()}`,
      designatedDoctorId: designatedDoctor ? designatedDoctor._id : null,
      designatedDoctorName: designatedDoctor ? designatedDoctor.name : '',
      designatedDoctorSpecialty: designatedDoctor ? (designatedDoctor.specialization || designatedDoctor.specialty || '') : '',
      vitalsSnapshot: {
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        bmi: bmiVal,
        medicalHistory: user.medicalHistory
      },
      clinicalDataSnapshot: clinicalSnapshot,
      pdfFileName: fileName,
      pdfPath: relativePath,
      generatedAt
    });

    // If a doctor was designated, automatically share exclusively with this doctor
    let sharedRecord = null;
    if (designatedDoctor) {
      const actualDoctorUserId = designatedDoctor.userId || designatedDoctor._id;
      sharedRecord = await SharedReport.create({
        reportId: report._id,
        patientId: user._id,
        doctorId: actualDoctorUserId,
        notes: clinicalNotes || `Patient shared ${diseaseFocus} clinical report with you.`,
        sharedAt: generatedAt,
        status: 'Shared'
      });
      report.sharedReportId = sharedRecord._id;
      await report.save();
    }

    // Automatically save symptom history
    const symptomLog = await SymptomLog.create({
      patientId: user._id,
      symptoms: `[${diseaseFocus}] ${symptoms}`,
      severity: finalSeverity,
      reportId: report._id,
      loggedAt: generatedAt
    });

    res.status(201).json({
      message: designatedDoctor
        ? `Health report for ${diseaseFocus} generated and shared exclusively with Dr. ${designatedDoctor.name}!`
        : `Health report for ${diseaseFocus} generated successfully!`,
      report,
      symptomLog,
      sharedRecord
    });
  } catch (error) {
    console.error('Error generating health report:', error);
    res.status(500).json({ message: error.message || 'Failed to generate health report.' });
  }
};

// @desc    Get report history for the logged-in patient
// @route   GET /api/reports
export const getReportHistory = async (req, res) => {
  try {
    const reports = await HealthReport.find({ patientId: req.user._id }).sort({ generatedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download the PDF for a specific report
// @route   GET /api/reports/:id/download
export const downloadReport = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ message: 'Invalid report id' });
  }

  try {
    // Allow either the owner patient or the designated/shared doctor to download
    const report = await HealthReport.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isPatient = report.patientId.toString() === req.user._id.toString();
    const isDoctor = req.user.role === 'doctor';

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to download this report.' });
    }

    const absolutePath = path.join(REPORTS_DIR, report.pdfFileName);
    res.download(absolutePath, report.pdfFileName, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ message: 'Report file not found on server' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};