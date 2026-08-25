import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateReport, downloadReport } from '../api/healthReportApi';
import { fetchDoctors } from '../api/doctorApi';
import '../styles/HealthReports.css';

const DISEASE_OPTIONS = [
  { id: 'diabetes', label: '🩸 Diabetes Mellitus & Blood Sugar', defaultSymptoms: 'Frequent urination, excessive thirst, increased fatigue after meals.' },
  { id: 'cardio', label: '🫀 Cardiovascular & Hypertension', defaultSymptoms: 'Elevated resting blood pressure, chest tightness during exertion, leg swelling.' },
  { id: 'pcos', label: '🌸 PCOS & Reproductive Health', defaultSymptoms: 'Irregular menstrual cycle, severe cramps, acne flare-ups, weight fluctuations.' },
  { id: 'mental_health', label: '🧠 Mental Health (Depression / Anxiety / OCD)', defaultSymptoms: 'Persistent low mood, difficulty concentrating, sleep disturbances, intrusive worry.' },
  { id: 'migraine', label: '🤕 Neurological & Migraine', defaultSymptoms: 'Throbbing unilateral headache, light sensitivity, visual aura.' },
  { id: 'gastric', label: '🩺 Gastric & Digestive Issues', defaultSymptoms: 'Upper abdominal pain, post-meal bloating, acid reflux, occasional nausea.' },
  { id: 'viral', label: '🌡️ Viral Infection & Common Cold', defaultSymptoms: 'Fever, sore throat, persistent cough, generalized muscle aches.' },
  { id: 'general', label: '📋 General Comprehensive Health Review', defaultSymptoms: 'Routine baseline health assessment, fatigue check, lifestyle evaluation.' },
  { id: 'custom', label: '✍️ Custom Condition / Specific Illness', defaultSymptoms: '' },
];

export default function GenerateReport() {
  const navigate = useNavigate();
  const [diseaseFocus, setDiseaseFocus] = useState('🩸 Diabetes Mellitus & Blood Sugar');
  const [customDiseaseName, setCustomDiseaseName] = useState('');
  const [symptoms, setSymptoms] = useState('Frequent urination, excessive thirst, increased fatigue after meals.');
  const [severity, setSeverity] = useState('Moderate');
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDoctors() {
      try {
        const data = await fetchDoctors().catch(() => []);
        if (isMounted) setDoctors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    }
    loadDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleDiseaseSelect(opt) {
    setDiseaseFocus(opt.label);
    if (opt.id !== 'custom' && opt.defaultSymptoms) {
      setSymptoms(opt.defaultSymptoms);
    }
  }

  const finalDiseaseName = diseaseFocus.includes('Custom')
    ? (customDiseaseName.trim() || 'Custom Health Condition')
    : diseaseFocus;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!symptoms.trim()) {
      setError('Please describe your observed symptoms before generating a report.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await generateReport({
        diseaseFocus: finalDiseaseName,
        symptoms,
        severity,
        targetDoctorId: targetDoctorId || null,
        clinicalNotes,
      });
      setResult(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    setError('');
    try {
      await downloadReport(result._id, result.pdfFileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="hr-page">
      <div className="hr-shell">
        <p className="hr-eyebrow">Targeted Clinical Summary</p>
        <h1>Generate Disease Health Report</h1>
        <p className="hr-subtext">
          Select a particular health condition to aggregate all related patient data (vitals, medications, logs, screenings) into a structured PDF report and optionally share it exclusively with your designated doctor.
        </p>

        {error && <div className="hr-error-banner">{error}</div>}

        <form className="hr-form" onSubmit={handleSubmit}>
          {/* 1. Disease Focus Selection */}
          <div className="hr-field">
            <label>1. Target Condition / Disease Focus</label>
            <div className="hr-disease-pills">
              {DISEASE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`hr-disease-chip ${diseaseFocus === opt.label ? 'active' : ''}`}
                  onClick={() => handleDiseaseSelect(opt)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {diseaseFocus.includes('Custom') && (
              <input
                type="text"
                className="hr-input"
                style={{ marginTop: '0.5rem' }}
                placeholder="Enter custom disease or illness name (e.g. Asthma, Thyroiditis)..."
                value={customDiseaseName}
                onChange={(e) => setCustomDiseaseName(e.target.value)}
                required
              />
            )}
          </div>

          {/* 2. Doctor Designation & Privacy */}
          <div className="hr-field">
            <label htmlFor="doctorSelect">
              2. Designate / Share Exclusively With Your Doctor (Optional)
            </label>
            <p className="hr-field-hint">
              🔒 When selected, all clinical records in this report are shared securely only with your chosen physician.
            </p>
            <select
              id="doctorSelect"
              value={targetDoctorId}
              onChange={(e) => setTargetDoctorId(e.target.value)}
              className="hr-select"
            >
              <option value="">Do not share (Keep private in my personal record)</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.name} — {doc.specialty || doc.specialization || 'Attending Physician'}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Symptoms & Severity */}
          <div className="hr-field">
            <label htmlFor="symptoms">3. Specific Symptoms & Clinical Notes</label>
            <textarea
              id="symptoms"
              rows={4}
              placeholder="Describe specific symptoms, onset, frequency, or reactions related to this condition..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
            />
          </div>

          <div className="hr-field-row">
            <div className="hr-field" style={{ flex: 1 }}>
              <label htmlFor="severity">Symptom Severity Rating</label>
              <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="Mild">Mild (Noticeable but manageable)</option>
                <option value="Moderate">Moderate (Impacts daily activity)</option>
                <option value="Severe">Severe (Significant clinical distress)</option>
              </select>
            </div>

            {targetDoctorId && (
              <div className="hr-field" style={{ flex: 1.5 }}>
                <label htmlFor="notes">Confidential Note to Doctor</label>
                <input
                  id="notes"
                  type="text"
                  placeholder="e.g. Requesting consultation on medication adjustment"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>
            )}
          </div>

          <button className="hr-btn-primary" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Aggregating Patient Data & Generating PDF…' : `📄 Generate ${finalDiseaseName.split(' ')[1] || 'Clinical'} Report`}
          </button>
        </form>

        {/* Results Card */}
        {result && (
          <div className="hr-result-card">
            <div className="hr-result-header">
              <span className="hr-result-icon">✅</span>
              <div>
                <p className="hr-result-title">
                  {result.diseaseFocus} Report Generated Successfully!
                </p>
                <p className="hr-result-meta">
                  Generated on {new Date(result.generatedAt).toLocaleString()} • File: {result.pdfFileName}
                </p>
                {result.designatedDoctorName && (
                  <p className="hr-result-doc-tag">
                    🔒 Shared securely with <strong>Dr. {result.designatedDoctorName}</strong> ({result.designatedDoctorSpecialty})
                  </p>
                )}
              </div>
            </div>

            <div className="hr-result-actions">
              <button className="hr-btn-primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Downloading…' : '📥 Download Printable PDF'}
              </button>
              <button className="hr-btn-secondary" onClick={() => navigate('/reports/history')}>
                📜 View in Report History
              </button>
              {result.designatedDoctorName && (
                <button className="hr-btn-secondary" onClick={() => navigate('/reports/share')}>
                  🤝 View Shared Reports
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}