import { useEffect, useState } from 'react';
import { fetchMyReceivedDiagnoses } from '../api/diagnosisApi';
import { getUser } from '../api/authApi';
import '../styles/MyDiagnoses.css';

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyDiagnoses() {
  const user = getUser();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  let bmi = null;
  let bmiCategory = 'Normal';
  if (user?.height && user?.weight && user.height > 0) {
    const hm = user.height / 100;
    bmi = Number((user.weight / (hm * hm)).toFixed(1));
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
    else if (bmi >= 30) bmiCategory = 'Obese';
  }

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchMyReceivedDiagnoses();
        if (isMounted) setDiagnoses(Array.isArray(data) ? data : []);
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
        <p className="diag-eyebrow">Clinical Care Coordination</p>
        <h1>My Diagnoses &amp; Prescriptions</h1>

        {/* Patient Vitals Card */}
        <div style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E7ECEA', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#5B6B65', fontWeight: 600 }}>REGISTERED CLINICAL VITALS</span>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.92rem', color: '#16241F' }}>
                ⚖️ <strong>Weight:</strong> {user?.weight ? `${user.weight} kg` : 'Not recorded'}
              </span>
              <span style={{ fontSize: '0.92rem', color: '#16241F' }}>
                📏 <strong>Height:</strong> {user?.height ? `${user.height} cm` : 'Not recorded'}
              </span>
              {bmi && (
                <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: bmiCategory === 'Normal' ? '#D1E7DD' : '#FEE2E2', color: bmiCategory === 'Normal' ? '#0F5132' : '#991B1B', fontWeight: 700 }}>
                  BMI: {bmi} ({bmiCategory})
                </span>
              )}
              <span style={{ fontSize: '0.92rem', color: '#5B6B65' }}>
                👤 {user?.age ? `${user.age} yrs` : ''} {user?.gender || ''}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="diag-error-banner">{error}</div>}

        {loading ? (
          <p className="diag-muted">Loading diagnosis records…</p>
        ) : diagnoses.length === 0 ? (
          <div className="diag-empty">
            <span style={{ fontSize: '2.5rem' }}>📋</span>
            <p className="diag-empty-title">No diagnosis records yet</p>
            <p>Once a physician reviews a clinical report you have shared, their diagnostic findings and prescribed treatments will appear here.</p>
          </div>
        ) : (
          <div className="diag-list">
            {diagnoses.map((d) => (
              <div key={d._id} className="diag-card">
                <div className="diag-card-header">
                  <div className="diag-card-doctor">
                    👨‍⚕️ Dr. {d.doctorId?.name}
                    {d.doctorId?.specialization ? ` — ${d.doctorId.specialization}` : ''}
                  </div>
                  <div className="diag-card-date">{formatDate(d.createdAt)}</div>
                </div>

                <p className="diag-section-title">Diagnostic Findings &amp; Clinical Notes</p>
                <p className="diag-text">{d.diagnosisNotes}</p>

                {d.observations && (
                  <>
                    <p className="diag-section-title">Clinical Observations</p>
                    <p className="diag-text">{d.observations}</p>
                  </>
                )}

                {d.recommendations && (
                  <>
                    <p className="diag-section-title">Doctor's Recommendations</p>
                    <p className="diag-text">{d.recommendations}</p>
                  </>
                )}

                {d.medicines?.length > 0 && (
                  <>
                    <p className="diag-section-title">Prescription &amp; Dosage Instructions</p>
                    <div className="diag-medicine-table">
                      {d.medicines.map((m, i) => (
                        <div key={i} className="diag-medicine-row">
                          <span className="diag-medicine-name">💊 {m.name}</span>
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