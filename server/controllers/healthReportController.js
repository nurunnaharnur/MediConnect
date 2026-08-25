import mongoose from 'mongoose';
import path from 'path';
import HealthReport from '../models/HealthReport.js';
import SymptomLog from '../models/SymptomLog.js';
import User from '../models/User.js';
import { generateHealthReportPDF, REPORTS_DIR } from '../utils/pdfGenerator.js';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @desc    Generate a health report (also saves a symptom log entry)
// @route   POST /api/reports/generate
export const generateReport = async (req, res) => {
  const { symptoms, severity } = req.body;

  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ message: 'symptoms is required' });
  }
  const allowedSeverity = ['Mild', 'Moderate', 'Severe'];
  const finalSeverity = allowedSeverity.includes(severity) ? severity : 'Mild';

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const generatedAt = new Date();

    const { fileName, relativePath } = await generateHealthReportPDF({
      user,
      symptoms,
      severity: finalSeverity,
      generatedAt
    });

    const report = await HealthReport.create({
      patientId: user._id,
      symptoms,
      severity: finalSeverity,
      summary: `Report generated on ${generatedAt.toLocaleDateString()} for reported symptoms: ${symptoms.slice(0, 120)}`,
      vitalsSnapshot: {
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        medicalHistory: user.medicalHistory
      },
      pdfFileName: fileName,
      pdfPath: relativePath,
      generatedAt
    });

    // Automatically save symptom history whenever a report is generated
    const symptomLog = await SymptomLog.create({
      patientId: user._id,
      symptoms,
      severity: finalSeverity,
      reportId: report._id,
      loggedAt: generatedAt
    });

    res.status(201).json({ report, symptomLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const report = await HealthReport.findOne({ _id: id, patientId: req.user._id });
    if (!report) return res.status(404).json({ message: 'Report not found' });

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