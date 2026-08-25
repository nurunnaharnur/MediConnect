import { useEffect, useState } from 'react';
import { fetchMyReceivedDiagnoses } from '../api/diagnosisApi';
import '../styles/MyDiagnoses.css';

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyDiagnoses() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchMyReceivedDiagnoses();
        if (isMounted) setDiagnoses(data);
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
    <div className="diag-page">
      <div className="diag-shell">
        <p className="diag-eyebrow">Care coordination</p>
        <h1>My Diagnosis &amp; Prescriptions</h1>

        {error && <div className="diag-error-banner">{error}</div>}

        {loading ? (
          <p className="diag-muted">Loading…</p>
        ) : diagnoses.length === 0 ? (
          <div className="diag-empty">
            <p className="diag-empty-title">No diagnosis records yet</p>
            <p>Once a doctor reviews a report you've shared, their notes will appear here.</p>
          </div>
        ) : (
          <div className="diag-list">
            {diagnoses.map((d) => (
              <div key={d._id} className="diag-card">
                <div className="diag-card-header">
                  <div className="diag-card-doctor">
                    Dr. {d.doctorId?.name}
                    {d.doctorId?.specialization ? ` — ${d.doctorId.specialization}` : ''}
                  </div>
                  <div className="diag-card-date">{formatDate(d.createdAt)}</div>
                </div>

                <p className="diag-section-title">Diagnosis notes</p>
                <p className="diag-text">{d.diagnosisNotes}</p>

                {d.observations && (
                  <>
                    <p className="diag-section-title">Observations</p>
                    <p className="diag-text">{d.observations}</p>
                  </>
                )}

                {d.recommendations && (
                  <>
                    <p className="diag-section-title">Recommendations</p>
                    <p className="diag-text">{d.recommendations}</p>
                  </>
                )}

                {d.medicines?.length > 0 && (
                  <>
                    <p className="diag-section-title">Prescription</p>
                    <div className="diag-medicine-table">
                      {d.medicines.map((m, i) => (
                        <div key={i} className="diag-medicine-row">
                          <span className="diag-medicine-name">{m.name}</span>
                          <span>{m.dosage}</span>
                          <span>{m.frequency}</span>
                          <span>{m.duration}</span>
                          {m.instructions && <span className="diag-medicine-instructions">{m.instructions}</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}