import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

// Directory where generated report PDFs are stored.
// Resolved relative to this file so it works regardless of the process cwd.
export const REPORTS_DIR = path.join(process.cwd(), 'server', 'uploads', 'reports');

export function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generates a health report PDF and writes it to disk.
 * Returns { fileName, relativePath, absolutePath } once the file is fully written.
 *
 * @param {Object} data
 * @param {Object} data.user - { name, email, age, gender, height, weight, medicalHistory }
 * @param {String} data.symptoms
 * @param {String} data.severity
 * @param {Date}   data.generatedAt
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