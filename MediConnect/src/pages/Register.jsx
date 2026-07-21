import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, saveSession } from '../api/authApi';
import '../styles/auth.css';

const initialForm = {
  name: '',
  email: '',
  password: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  medicalHistory: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
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
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      };
      const data = await registerUser(payload);
      saveSession(data);
      navigate('/dashboard');
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
          One place for your vitals, history, and reminders — set up in a
          couple of minutes.
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
          <p className="auth-pulse-caption">Let's get you set up</p>
        </div>
      </div>

      <div className="auth-formside">
        <div className="auth-card">
          <h1 className="auth-heading">Create your account</h1>
          <p className="auth-subheading">
            A few details help us personalize your reminders.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="auth-input"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
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

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="age">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  className="auth-input"
                  placeholder="28"
                  value={form.age}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="auth-select"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="height">
                  Height (cm)
                </label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  min="0"
                  className="auth-input"
                  placeholder="165"
                  value={form.height}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="weight">
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  className="auth-input"
                  placeholder="60"
                  value={form.weight}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="medicalHistory">
                Medical history (optional)
              </label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                className="auth-textarea"
                placeholder="Any conditions, allergies, or medications we should know about"
                value={form.medicalHistory}
                onChange={handleChange}
              />
            </div>

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
