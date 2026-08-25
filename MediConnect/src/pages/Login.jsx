import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, saveSession } from '../api/authApi';
import '../styles/auth.css';

export default function Login() {
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
      const data = await loginUser(form);
      saveSession(data);
      if (data.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <p className="auth-brand-mark">MediConnect</p>
        <p className="auth-brand-tag">
          Track your health, manage medication schedules, monitor emotional well-being, and stay connected with your care team.
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
              stroke="#c08a2e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="auth-pulse-caption">Patient Portal</p>
        </div>
      </div>

      <div className="auth-formside">
        <div className="auth-card">
          <div style={{ display: 'inline-block', background: '#E4EFEC', color: '#146356', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.6rem' }}>
            PATIENT LOGIN
          </div>
          <h1 className="auth-heading">Sign in to your care</h1>
          <p className="auth-subheading">
            Enter your patient credentials to access your medications, mood trends, and health records.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="patient@example.com"
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

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in as Patient'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

          {/* Doctor Portal Redirect */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E7ECEA', textAlign: 'center', fontSize: '0.88rem', color: '#5B6B65' }}>
            Are you a doctor? <Link to="/doctor-login" style={{ color: '#146356', fontWeight: '700', textDecoration: 'none' }}>Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}