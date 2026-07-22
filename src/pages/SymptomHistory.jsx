import { useEffect, useState } from 'react';
import { fetchSymptomHistory } from '../api/symptomLogApi';
import '../styles/HealthReports.css';

export default function SymptomHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSymptomHistory();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hr-page">
      <div className="hr-shell">
        <p className="hr-eyebrow">Chronological</p>
        <h1>Symptom history</h1>
        <p className="hr-subtext">
          Symptoms are saved automatically each time you generate a health report.
        </p>

        {error && <div className="hr-error-banner">{error}</div>}

        {loading ? (
          <p className="hr-muted">Loading symptom history…</p>
        ) : logs.length === 0 ? (
          <div className="hr-empty">
            <p className="hr-empty-title">No symptoms logged yet</p>
            <p>Generate a health report to start building your symptom timeline.</p>
          </div>
        ) : (
          <div className="hr-timeline">
            {logs.map((log) => (
              <div key={log._id} className="hr-timeline-item">
                <div className="hr-timeline-dot" />
                <div className="hr-timeline-content">
                  <p className="hr-timeline-date">{new Date(log.loggedAt).toLocaleString()}</p>
                  <p className="hr-timeline-symptoms">{log.symptoms}</p>
                  <span className={`hr-severity-tag ${log.severity.toLowerCase()}`}>{log.severity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}