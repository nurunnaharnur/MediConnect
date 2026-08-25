import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateReport, downloadReport } from '../api/healthReportApi';
import '../styles/HealthReports.css';

export default function GenerateReport() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('Mild');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!symptoms.trim()) {
      setError('Describe your symptoms before generating a report.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await generateReport({ symptoms, severity });
      setResult(data.report);
      setSymptoms('');
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
        <p className="hr-eyebrow">Automated report</p>
        <h1>Generate health report</h1>
        <p className="hr-subtext">
          Describe how you're feeling. We'll save it to your symptom history and generate a
          downloadable PDF report.
        </p>

        {error && <div className="hr-error-banner">{error}</div>}

        <form className="hr-form" onSubmit={handleSubmit}>
          <div className="hr-field">
            <label htmlFor="symptoms">Symptoms</label>
            <textarea
              id="symptoms"
              placeholder="e.g. Mild headache since this morning, slight fatigue, no fever"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div className="hr-field">
            <label htmlFor="severity">Severity</label>
            <select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
          </div>

          <button className="hr-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate report'}
          </button>
        </form>

        {result && (
          <div className="hr-result-card">
            <p className="hr-result-title">Report generated</p>
            <p className="hr-result-meta">
              Generated on {new Date(result.generatedAt).toLocaleString()}
            </p>
            <div className="hr-result-actions">
              <button className="hr-btn-primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Downloading…' : 'Download PDF'}
              </button>
              <button className="hr-btn-secondary" onClick={() => navigate('/reports/history')}>
                View report history
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}