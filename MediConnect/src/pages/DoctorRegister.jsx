import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerDoctor, saveSession } from '../api/authApi';
import { fetchAllHospitals } from '../api/hospitalApi';
import '../styles/auth.css';

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Psychiatrist / Clinical Psychologist',
  'Neurologist',
  'Endocrinologist',
  'Gynecologist',
  'Dermatologist',
  'Gastroenterologist',
  'Orthopedic / Rheumatologist',
  'Other Specialty'
];

export default function DoctorRegister() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    specialization: 'General Physician',
    qualification: '',
    experienceYears: '5',
    hospitalId: '',
    licenseNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadHospitals() {
      try {
        const data = await fetchAllHospitals();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setHospitals(data);
          setForm((prev) => ({ ...prev, hospitalId: data[0]._id }));
        }
      } catch (err) {
        console.warn('Could not load hospital list during registration:', err);
      }
    }
    loadHospitals();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerDoctor({
        ...form,
        experienceYears: parseInt(form.experienceYears, 10) || 5
      });
      saveSession(data);
      navigate('/doctor-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-branding" style={{ background: 'linear-gradient(135deg, #0F3D35 0%, #16241F 100%)' }}>
        <p className="auth-brand-mark">MediConnect 🩺</p>
        <p className="auth-brand-tag">
          Join the MediConnect Healthcare Provider Network to connect with patients, receive exclusive disease health reports, and appear in nearby doctor and hospital discovery.
        </p>
        <div className="auth-pulse-wrap">
          <p className="auth-pulse-caption">Physician Network Registration</p>
        </div>
      </div>

      <div className="auth-formside">
        <div className="auth-card" style={{ maxWidth: '520px' }}>
          <div style={{ display: 'inline-block', background: '#D1E7DD', color: '#0F5132', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.6rem' }}>
            PHYSICIAN ENROLLMENT &amp; DISCOVERY
          </div>
          <h1 className="auth-heading">Register Provider Account</h1>
          <p className="auth-subheading">
            Create your clinical credentials to access your patient panel and appear in patient discovery.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label" htmlFor="name">
                Full Name &amp; Title (e.g. Dr. Jane Doe, MD)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="auth-input"
                placeholder="Dr. Jane Doe, MD"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Medical Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="jane.doe@hospital.org"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="specialization">
                Medical Specialty / Department
              </label>
              <select
                id="specialization"
                name="specialization"
                className="auth-input"
                value={form.specialization}
                onChange={handleChange}
                required
              >
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="hospitalId">
                Affiliated Hospital or Clinic
              </label>
              <select
                id="hospitalId"
                name="hospitalId"
                className="auth-input"
                value={form.hospitalId}
                onChange={handleChange}
              >
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>
                    🏥 {h.name} — {h.address}
                  </option>
                ))}
                {hospitals.length === 0 && (
                  <option value="">General Telehealth &amp; Clinical Practice</option>
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="experienceYears">
                  Years of Experience
                </label>
                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="60"
                  className="auth-input"
                  placeholder="5"
                  value={form.experienceYears}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="licenseNumber">
                  License / Provider ID
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. BMDC-8942"
                  value={form.licenseNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="qualification">
                Degrees &amp; Qualifications (Optional)
              </label>
              <input
                id="qualification"
                name="qualification"
                type="text"
                className="auth-input"
                placeholder="e.g. MBBS, FCPS (Medicine), MD"
                value={form.qualification}
                onChange={handleChange}
              />
            </div>

            <button className="auth-button" type="submit" disabled={loading} style={{ background: '#0F4E44' }}>
              {loading ? 'Creating Provider Account & Syncing Discovery…' : 'Register Provider Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/doctor-login">Doctor Login</Link>
          </p>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E7ECEA', textAlign: 'center', fontSize: '0.88rem', color: '#5B6B65' }}>
            Are you a patient? <Link to="/login" style={{ color: '#146356', fontWeight: '700', textDecoration: 'none' }}>Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
