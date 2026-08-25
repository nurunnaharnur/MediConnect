import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReportsSharedWithMe } from '../api/sharedReportApi';
import '../styles/DoctorReports.css';

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
        if (isMounted) setShared(Array.isArray(data) ? data : []);
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
        <p className="docrep-eyebrow">Confidential Patient Records</p>
        <h1>Exclusive Shared Patient Reports</h1>
        <p className="docrep-subtext" style={{ color: '#5B6B65', margin: '0 0 1.5rem' }}>
          Review disease-specific clinical summaries, vitals, active prescriptions, and symptom histories securely submitted exclusively to you by your patients.
        </p>

        {error && <div className="docrep-error-banner">{error}</div>}

        {loading ? (
          <p className="docrep-muted">Loading confidential patient reports…</p>
        ) : shared.length === 0 ? (
          <div className="docrep-empty">
            <span style={{ fontSize: '2.5rem' }}>📋</span>
            <p className="docrep-empty-title">No Reports Shared With You Yet</p>
            <p>When patients designate and share their disease health reports with you, they will appear here.</p>
          </div>
        ) : (
          <div className="docrep-list">
            {shared.map((s) => (
              <div key={s._id} className="docrep-card">
                <div className="docrep-card-main">
                  <div>
                    <div className="docrep-card-patient">
                      👤 {s.patientId?.name || 'Patient'} ({s.patientId?.gender || '—'}, {s.patientId?.age ? `${s.patientId.age} yrs` : '—'})
                    </div>
                    <div className="docrep-card-report">
                      <strong style={{ color: '#146356' }}>
                        {s.reportId?.diseaseFocus || 'General Clinical Health'}
                      </strong>{' '}
                      • {s.reportId?.severity} Severity • Generated: {formatDate(s.reportId?.generatedAt)}
                    </div>
                  </div>
                  <span className={`docrep-status-tag ${(s.status || 'shared').toLowerCase()}`}>{s.status}</span>
                </div>

                <p className="docrep-card-symptoms">
                  <strong>Reported Symptoms:</strong> {s.reportId?.symptoms}
                </p>

                {s.notes && (
                  <p style={{ fontSize: '0.82rem', color: '#0369A1', background: '#F0F9FF', padding: '0.4rem 0.75rem', borderRadius: '8px', margin: '0.4rem 0' }}>
                    💬 <strong>Patient's Note:</strong> {s.notes}
                  </p>
                )}

                <div className="docrep-card-actions">
                  <button className="docrep-btn-primary" onClick={() => navigate(`/doctor/reports/${s._id}`)}>
                    🔍 Review Clinical Data & Provide Diagnosis →
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