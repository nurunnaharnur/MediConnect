import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDoctorById } from '../api/doctorApi';
import '../styles/HospitalFinder.css';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchDoctorById(id);
        if (isMounted) setDoctor(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load doctor profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="hf-page">
        <div className="hf-shell" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <span className="hf-loading-spinner" />
          <p style={{ marginTop: '1rem', color: '#5B6B65' }}>Loading doctor profile…</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="hf-page">
        <div className="hf-shell">
          <Link to="/hospitals" className="hf-back-link">← Back to Hospital Search</Link>
          <div className="hf-alert-error" style={{ marginTop: '1rem' }}>
            {error || 'Doctor not found.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hf-page">
      <div className="hf-shell">
        <Link to="/hospitals" className="hf-back-link">← Back to Hospital & Doctor Search</Link>

        <div className="hf-profile-card">
          <div className="hf-profile-header">
            <div className="hf-profile-avatar">👨‍⚕️</div>
            <div className="hf-profile-main-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h1 className="hf-profile-name">{doctor.name}</h1>
                  <p className="hf-profile-specialty">{doctor.specialty}</p>
                </div>
                <span className="hf-rating-badge" style={{ fontSize: '0.9rem', padding: '0.35rem 0.8rem' }}>
                  ⭐ {Number(doctor.rating).toFixed(1)} / 5.0 Rating
                </span>
              </div>
              <p className="hf-profile-exp">
                🎓 {doctor.experienceYears} Years of Clinical Practice Experience
              </p>
            </div>
          </div>

          {doctor.bio && (
            <div className="hf-profile-section">
              <h4>About & Clinical Focus</h4>
              <p className="hf-profile-bio">{doctor.bio}</p>
            </div>
          )}

          {doctor.hospitalId && (
            <div className="hf-profile-section">
              <h4>Affiliated Healthcare Center</h4>
              <div className="hf-affiliated-hospital">
                <strong>🏥 {doctor.hospitalId.name}</strong>
                <p>📍 {doctor.hospitalId.address}</p>
                {doctor.hospitalId.phone && <p>📞 {doctor.hospitalId.phone}</p>}
              </div>
            </div>
          )}

          <div className="hf-profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h4 style={{ margin: 0 }}>Weekly Consultation Schedule & Availability</h4>
              <button
                type="button"
                className="hf-btn-book-profile"
                onClick={() => navigate('/appointments')}
              >
                📅 Schedule Consultation
              </button>
            </div>

            {!doctor.availableSlots || doctor.availableSlots.length === 0 ? (
              <p className="hf-no-slots">No weekly consultation slots currently listed for this physician.</p>
            ) : (
              <div className="hf-slots-grid">
                {doctor.availableSlots.map((slot, i) => (
                  <div key={i} className="hf-slot-card">
                    <span className="hf-slot-day">{slot.day}</span>
                    <span className="hf-slot-time">⏰ {slot.startTime} – {slot.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
