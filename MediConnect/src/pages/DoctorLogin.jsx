import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginDoctor, saveSession } from '../api/authApi';
import '../styles/auth.css';

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const data = await loginDoctor(form);
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
          Provider Clinical Portal — Securely review patient health histories, monitor mood and medication adherence trends, and manage appointments.
        </p>
        <div className="auth-pulse-wrap">
          <svg
            className="auth-pulse-line"
            viewBox="0 0 400 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 30 H120 L140 8 L158 52 L172 30 H210 L226 14 L242 46 L256 30 H400"
              stroke="#20C997"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="auth-pulse-caption">Clinical Provider Workspace</p>
        </div>
      </div>

      <div className="auth-formside">
        <div className="auth-card">
          <div style={{ display: 'inline-block', background: '#D1E7DD', color: '#0F5132', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.6rem' }}>
            PHYSICIAN & PROVIDER PORTAL
          </div>
          <h1 className="auth-heading">Doctor Sign In</h1>
          <p className="auth-subheading">
            Enter your medical provider credentials to access the patient clinical management dashboard.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Doctor Email / Username
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="doctor@hospital.org"
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

            <button className="auth-button" type="submit" disabled={loading} style={{ background: '#0F4E44' }}>
              {loading ? 'Authenticating…' : 'Sign in as Doctor'}
            </button>
          </form>

          <p className="auth-switch">
            New provider? <Link to="/doctor-register">Register doctor account</Link>
          </p>

          {/* Link back to Patient Login */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E7ECEA', textAlign: 'center', fontSize: '0.88rem', color: '#5B6B65' }}>
            Are you a patient? <Link to="/login" style={{ color: '#146356', fontWeight: '700', textDecoration: 'none' }}>Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
