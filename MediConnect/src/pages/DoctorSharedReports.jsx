import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReportsSharedWithMe } from '../api/sharedReportApi';
import '../styles/DoctorReports.css';

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DoctorSharedReports() {
  const navigate = useNavigate();
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchReportsSharedWithMe();
        if (isMounted) setShared(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="docrep-page">
      <div className="docrep-shell">
        <p className="docrep-eyebrow">Patient care</p>
        <h1>Shared Patient Reports</h1>

        {error && <div className="docrep-error-banner">{error}</div>}

        {loading ? (
          <p className="docrep-muted">Loading…</p>
        ) : shared.length === 0 ? (
          <div className="docrep-empty">
            <p className="docrep-empty-title">No reports shared with you yet</p>
            <p>When a patient shares a health report with you, it will appear here.</p>
          </div>
        ) : (
          <div className="docrep-list">
            {shared.map((s) => (
              <div key={s._id} className="docrep-card">
                <div className="docrep-card-main">
                  <div>
                    <div className="docrep-card-patient">{s.patientId?.name}</div>
                    <div className="docrep-card-report">
                      {s.reportId?.severity} report — {formatDate(s.reportId?.generatedAt)}
                    </div>
                  </div>
                  <span className={`docrep-status-tag ${s.status.toLowerCase()}`}>{s.status}</span>
                </div>
                <p className="docrep-card-symptoms">{s.reportId?.symptoms}</p>
                <div className="docrep-card-actions">
                  <button className="docrep-btn-primary" onClick={() => navigate(`/doctor/reports/${s._id}`)}>
                    View &amp; diagnose
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}