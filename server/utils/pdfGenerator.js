import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

// Directory where generated report PDFs are stored.
export const REPORTS_DIR = path.join(process.cwd(), 'server', 'uploads', 'reports');

export function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generates a standard symptom health report PDF and writes it to disk.
 */
export function generateHealthReportPDF({ user, symptoms, severity, generatedAt }) {
  ensureReportsDir();

  const fileName = `report_${user._id}_${Date.now()}.pdf`;
  const absolutePath = path.join(REPORTS_DIR, fileName);
  const relativePath = path.join('server', 'uploads', 'reports', fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(absolutePath);

    stream.on('finish', () => resolve({ fileName, relativePath, absolutePath }));
    stream.on('error', reject);

    doc.pipe(stream);

    doc
      .fontSize(20)
      .fillColor('#146356')
      .text('MediConnect Health Report', { align: 'center' })
      .moveDown(1.5);

    doc
      .fontSize(11)
      .fillColor('black')
      .text(`Generated: ${new Date(generatedAt).toLocaleString()}`)
      .moveDown(1);

    doc.fontSize(14).fillColor('#146356').text('Patient Information');
    doc
      .fontSize(11)
      .fillColor('black')
      .text(`Name: ${user.name || '-'}`)
      .text(`Email: ${user.email || '-'}`)
      .text(`Age: ${user.age ?? '-'}`)
      .text(`Gender: ${user.gender || '-'}`)
      .text(`Height: ${user.height ?? '-'} cm`)
      .text(`Weight: ${user.weight ?? '-'} kg`)
      .text(`Medical History: ${user.medicalHistory || 'None reported'}`)
      .moveDown(1);

    doc.fontSize(14).fillColor('#146356').text('Reported Symptoms');
    doc
      .fontSize(11)
      .fillColor('black')
      .text(`Severity: ${severity}`)
      .moveDown(0.3)
      .text(symptoms, { align: 'left' })
      .moveDown(1);

    doc.fontSize(14).fillColor('#146356').text('Notes');
    doc
      .fontSize(11)
      .fillColor('black')
      .text(
        'This report was generated automatically from the symptoms you logged in MediConnect. ' +
        'It is not a medical diagnosis. Please consult a licensed physician for medical advice.'
      );

    doc.end();
  });
}

/**
 * Generates a comprehensive, printable all-in-one Patient Health Profile & Clinical Record PDF
 * and streams it directly to a writable stream (e.g. HTTP response stream).
 */
export function streamComprehensiveHealthProfilePDF(data, outputStream) {
  const {
    user,
    medications = [],
    moodEntries = [],
    screenings = [],
    cycleData = null,
    appointments = [],
    diagnoses = [],
    generatedAt = new Date()
  } = data;

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    info: {
      Title: `MediConnect Health Profile - ${user.name}`,
      Author: 'MediConnect Healthcare Platform',
      Subject: 'Patient Comprehensive Medical & Health Profile'
    }
  });

  doc.pipe(outputStream);

  // Helper for section headers
  function drawSectionHeader(title, icon = '•') {
    doc.moveDown(0.8);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F4E44').text(`${icon} ${title.toUpperCase()}`);
    doc.strokeColor('#B2DFDB').lineWidth(1).moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#212121');
  }

  // --- Header Banner ---
  doc.rect(40, 35, doc.page.width - 80, 54).fill('#E4EFEC');
  doc.fillColor('#0F4E44').fontSize(18).font('Helvetica-Bold').text('MEDICONNECT HEALTHCARE', 55, 45);
  doc.fontSize(9).font('Helvetica').fillColor('#264E46').text('COMPREHENSIVE PATIENT HEALTH PROFILE & CLINICAL RECORD', 55, 67);

  const genDateStr = new Date(generatedAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  doc.fontSize(8).fillColor('#4B6358').text(`Document Generated: ${genDateStr}`, doc.page.width - 240, 48, { align: 'right', width: 180 });
  doc.text(`Patient ID: ${user._id}`, doc.page.width - 240, 62, { align: 'right', width: 180 });

  doc.y = 100;

  // --- 1. Patient Demographics & Baseline Vitals ---
  drawSectionHeader('1. Patient Demographics & Baseline Vitals', '📋');

  let bmiStr = 'Not calculated';
  let bmiCategory = '';
  if (user.height && user.weight && user.height > 0) {
    const hm = user.height / 100;
    const bmiVal = Number((user.weight / (hm * hm)).toFixed(1));
    if (bmiVal < 18.5) bmiCategory = '(Underweight)';
    else if (bmiVal < 25) bmiCategory = '(Normal)';
    else if (bmiVal < 30) bmiCategory = '(Overweight)';
    else bmiCategory = '(Obese)';
    bmiStr = `${bmiVal} kg/m² ${bmiCategory}`;
  }

  const col1X = 50;
  const col2X = 300;
  let startY = doc.y;

  doc.text(`Full Name: `, col1X, startY, { continued: true }).font('Helvetica-Bold').text(user.name || '—');
  doc.font('Helvetica').text(`Email: `, col1X, doc.y + 2, { continued: true }).font('Helvetica-Bold').text(user.email || '—');
  doc.font('Helvetica').text(`Gender: `, col1X, doc.y + 2, { continued: true }).font('Helvetica-Bold').text(user.gender || '—');
  doc.font('Helvetica').text(`Age: `, col1X, doc.y + 2, { continued: true }).font('Helvetica-Bold').text(user.age ? `${user.age} years` : '—');

  doc.font('Helvetica').text(`Height: `, col2X, startY, { continued: true }).font('Helvetica-Bold').text(user.height ? `${user.height} cm` : '—');
  doc.font('Helvetica').text(`Weight: `, col2X, doc.y + 2, { continued: true }).font('Helvetica-Bold').text(user.weight ? `${user.weight} kg` : '—');
  doc.font('Helvetica').text(`BMI: `, col2X, doc.y + 2, { continued: true }).font('Helvetica-Bold').text(bmiStr);
  doc.font('Helvetica').text(`Role: `, col2X, doc.y + 2, { continued: true }).font('Helvetica-Bold').text(user.role ? user.role.toUpperCase() : 'PATIENT');

  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Known Medical History & Diagnoses:');
  doc.font('Helvetica').fillColor('#374151').text(user.medicalHistory || 'No pre-existing conditions or medical history reported.');

  // --- 2. Emergency Contact Information ---
  drawSectionHeader('2. Emergency Contact & Guardian Care Details', '🚨');
  if (user.emergencyContact && user.emergencyContact.name) {
    doc.text(`Contact Name: `, { continued: true }).font('Helvetica-Bold').text(user.emergencyContact.name);
    doc.font('Helvetica').text(`Relationship: `, { continued: true }).font('Helvetica-Bold').text(user.emergencyContact.relationship || 'Guardian');
    doc.font('Helvetica').text(`Contact Email: `, { continued: true }).font('Helvetica-Bold').text(user.emergencyContact.email || '—');
    doc.font('Helvetica').text(`Contact Phone: `, { continued: true }).font('Helvetica-Bold').text(user.emergencyContact.phone || '—');
  } else {
    doc.fillColor('#6B7280').text('No primary emergency contact registered.');
  }

  // --- 3. Active Medications & Adherence ---
  drawSectionHeader('3. Medication Schedule & Adherence Records', '💊');
  if (medications.length === 0) {
    doc.fillColor('#6B7280').text('No medication reminders currently registered.');
  } else {
    medications.forEach((med, idx) => {
      const timesStr = Array.isArray(med.times) ? med.times.join(', ') : (med.time || '—');
      doc.font('Helvetica-Bold').fillColor('#1F2937').text(`${idx + 1}. ${med.name} (${med.dosage || 'Standard dose'})`);
      doc.font('Helvetica').fillColor('#4B5563')
        .text(`   Frequency: ${med.frequency || 'Daily'} | Schedule: ${timesStr} | Status: ${(med.status || 'Active').toUpperCase()}`)
        .moveDown(0.2);
    });
  }

  // --- 4. Mental Well-being & Mood Tracker ---
  drawSectionHeader('4. Mental Well-being & Emotional Trajectory', '🧠');
  if (moodEntries.length === 0 && screenings.length === 0) {
    doc.fillColor('#6B7280').text('No mood check-ins or mental well-being screenings recorded.');
  } else {
    if (moodEntries.length > 0) {
      doc.font('Helvetica-Bold').fillColor('#1F2937').text('Recent Mood Check-ins:');
      moodEntries.slice(0, 5).forEach((m) => {
        const dStr = new Date(m.entryDate || m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const emStr = (m.emotions && m.emotions.length > 0) ? ` [${m.emotions.join(', ')}]` : '';
        const noteStr = m.note ? ` - "${m.note}"` : '';
        doc.font('Helvetica').fillColor('#4B5563').text(` • ${dStr}: Mood ${(m.mood || '').replace('_', ' ').toUpperCase()} (Score: ${m.moodScore}/5)${emStr}${noteStr}`);
      });
      doc.moveDown(0.4);
    }

    if (screenings.length > 0) {
      doc.font('Helvetica-Bold').fillColor('#1F2937').text('Screening Assessments History:');
      screenings.slice(0, 4).forEach((s) => {
        const sDate = new Date(s.completedAt || s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        doc.font('Helvetica').fillColor('#4B5563')
          .text(` • ${sDate}: ${s.screeningType} - Score: ${s.totalScore}/${s.maxScore} (Indication: ${s.indicationLevel || 'Standard'})`);
      });
    }
  }

  // --- 5. Menstrual & Reproductive Cycle Tracking ---
  if (cycleData && cycleData.phase) {
    drawSectionHeader('5. Menstrual Cycle & Reproductive Wellness', '🌸');
    doc.text(`Current Phase: `, { continued: true }).font('Helvetica-Bold').text(`${cycleData.phase} (Day ${cycleData.currentCycleDay} of ${cycleData.cycleLength})`);
    doc.font('Helvetica').text(`Cycle Length: `, { continued: true }).font('Helvetica-Bold').text(`${cycleData.cycleLength || 28} days (Period Duration: ${cycleData.periodDuration || 5} days)`);
    if (cycleData.nextPeriodDate) {
      const nextDateStr = new Date(cycleData.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.font('Helvetica').text(`Next Estimated Period: `, { continued: true }).font('Helvetica-Bold').text(`${nextDateStr} (~${cycleData.daysUntilNext} days)`);
    }
  }

  // --- 6. Clinical Consultations & Doctor Appointments ---
  drawSectionHeader('6. Physician Consultations & Appointments', '📅');
  if (appointments.length === 0) {
    doc.fillColor('#6B7280').text('No recorded appointments or consultations.');
  } else {
    appointments.slice(0, 6).forEach((appt, idx) => {
      const apptDate = new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.font('Helvetica-Bold').fillColor('#1F2937').text(`${idx + 1}. ${appt.doctorName || 'Doctor'} (${appt.doctorSpecialty || appt.department || 'General Practice'})`);
      doc.font('Helvetica').fillColor('#4B5563')
        .text(`   Date: ${apptDate} at ${appt.time} | Status: ${(appt.status || 'scheduled').toUpperCase()}`)
        .text(`   Reason: ${appt.reason || 'Routine consultation'}`);
      if (appt.clinicalNotes) {
        doc.font('Helvetica-Oblique').fillColor('#0F5132').text(`   Clinical Note: "${appt.clinicalNotes}"`);
      }
      doc.moveDown(0.2);
    });
  }

  // --- 7. Formal Doctor Diagnoses & Clinical Prescriptions ---
  if (diagnoses.length > 0) {
    drawSectionHeader('7. Official Diagnoses & Clinical Prescriptions', '🩺');
    diagnoses.forEach((diag, idx) => {
      const diagDate = new Date(diag.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.font('Helvetica-Bold').fillColor('#111827').text(`${idx + 1}. Diagnosis Recorded on ${diagDate}:`);
      doc.font('Helvetica').fillColor('#374151')
        .text(`   Notes: ${diag.diagnosisNotes}`)
        .text(`   Observations: ${diag.observations || 'None'}`)
        .text(`   Recommendations: ${diag.recommendations || 'None'}`);

      if (diag.medicines && diag.medicines.length > 0) {
        doc.font('Helvetica-Bold').text('   Prescribed Medications:');
        diag.medicines.forEach((med) => {
          doc.font('Helvetica').text(`     - ${med.name}: ${med.dosage}, ${med.frequency} for ${med.duration} (${med.instructions || 'Follow instructions'})`);
        });
      }
      doc.moveDown(0.3);
    });
  }

  // --- Footer Notice & Disclaimer ---
  doc.moveDown(1.2);
  doc.rect(40, doc.y, doc.page.width - 80, 42).fill('#F3F4F6');
  doc.fillColor('#4B5563').fontSize(7.5).font('Helvetica')
    .text(
      'CONFIDENTIAL MEDICAL RECORD: This document contains personal healthcare information exported from MediConnect. ' +
      'It is provided for personal health management and consultation support. Not a standalone clinical diagnostic device.',
      50,
      doc.y - 36,
      { width: doc.page.width - 100, align: 'center' }
    );

  doc.end();
}