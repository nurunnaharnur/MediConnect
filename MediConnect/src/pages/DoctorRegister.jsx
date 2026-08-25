import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerDoctor, saveSession } from '../api/authApi';
import '../styles/auth.css';

const SPECIALIZATIONS = [
  'General Practice / Internal Medicine',
  'Cardiology',
  'Psychiatry & Behavioral Health',
  'Neurology',
  'Endocrinology',
  'Pulmonology',
  'Pediatrics',
  'Geriatrics',
  'Other Specialty'
];

export default function DoctorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    specialization: 'General Practice / Internal Medicine',
    licenseNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerDoctor(form);
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
          Join the MediConnect Healthcare Provider Network to connect with patients, track therapeutic outcomes, and manage consultations.
        </p>
        <div className="auth-pulse-wrap">
          <p className="auth-pulse-caption">Physician Registration</p>
        </div>
      </div>

      <div className="auth-formside">
        <div className="auth-card" style={{ maxWidth: '480px' }}>
          <div style={{ display: 'inline-block', background: '#D1E7DD', color: '#0F5132', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.6rem' }}>
            PHYSICIAN ENROLLMENT
          </div>
          <h1 className="auth-heading">Register Provider Account</h1>
          <p className="auth-subheading">
            Create your clinical credentials to access your patient panel.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label" htmlFor="name">
                Full Name & Title (e.g. Dr. Jane Doe, MD)
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
                Medical Specialization
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
              <label className="auth-label" htmlFor="licenseNumber">
                Medical License / Provider ID (Optional)
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                className="auth-input"
                placeholder="e.g. MD-984210"
                value={form.licenseNumber}
                onChange={handleChange}
              />
            </div>

            <button className="auth-button" type="submit" disabled={loading} style={{ background: '#0F4E44' }}>
              {loading ? 'Creating Provider Account…' : 'Register Provider Account'}
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
