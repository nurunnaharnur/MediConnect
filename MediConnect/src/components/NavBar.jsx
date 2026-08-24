import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../api/authApi';
import '../styles/NavBar.css';

const PATIENT_LINKS = [
  { to: '/dashboard', label: 'Reminders' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/reports/generate', label: 'Generate Report' },
  { to: '/reports/history', label: 'Report History' },
  { to: '/symptoms', label: 'Symptom History' },
  { to: '/cycles', label: 'Cycle Tracker' },
  { to: '/cycles/prediction', label: 'Cycle Prediction' },
  { to: '/pcos', label: 'PCOS Check' },
  { to: '/reports/share', label: 'Share Report' },
  { to: '/diagnoses', label: 'My Diagnoses' },
];

const DOCTOR_LINKS = [
  { to: '/doctor/reports', label: 'Shared Reports' },
];

export default function NavBar() {
  const navigate = useNavigate();
  const user = getUser();
  const links = user?.role === 'doctor' ? DOCTOR_LINKS : PATIENT_LINKS;

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <nav className="mc-navbar">
      <div className="mc-navbar-inner">
        <span className="mc-navbar-brand">MediConnect</span>
        <div className="mc-navbar-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mc-navbar-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <button className="mc-navbar-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}