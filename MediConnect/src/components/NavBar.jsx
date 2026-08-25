import { NavLink, Link, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../api/authApi';
import '../styles/NavBar.css';

const PATIENT_LINKS = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/hospitals', label: '🏥 Find Hospitals' },
  { to: '/symptom-checker', label: '🩺 Symptom Checker' },
  { to: '/diet-fitness', label: '🥗 Diet & Fitness' },
  { to: '/blood-pressure', label: '🫀 Blood Pressure' },
  { to: '/reminders', label: '💊 Reminders' },
  { to: '/mental-wellbeing', label: '🧠 Mental Health' },
  { to: '/appointments', label: '📅 Appointments' },
  { to: '/cycles', label: '🌸 Menstruation Tracker' },
  { to: '/reports/generate', label: '📄 Health Report' },
  { to: '/reports/history', label: '📜 Report History' },
  { to: '/reports/share', label: '🤝 Share Report' },
  { to: '/diagnoses', label: '📋 Diagnoses' },
];

const DOCTOR_LINKS = [
  { to: '/doctor-dashboard', label: '🩺 Doctor Dashboard' },
  { to: '/doctor/reports', label: '📋 Shared Patient Reports' },
];

export default function NavBar() {
  const navigate = useNavigate();
  const user = getUser();
  const isDoctor = user?.role === 'doctor';
  const links = isDoctor ? DOCTOR_LINKS : PATIENT_LINKS;
  const homePath = isDoctor ? '/doctor-dashboard' : '/dashboard';

  function handleLogout() {
    clearSession();
    navigate(isDoctor ? '/doctor-login' : '/login');
  }

  return (
    <nav className="mc-navbar">
      <div className="mc-navbar-inner">
        <Link to={homePath} className="mc-navbar-brand">
          <span className="mc-brand-icon">{isDoctor ? '🩺' : '💊'}</span>
          <span>MediConnect</span>
        </Link>
        
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

        <div className="mc-navbar-right">
          <span className="mc-navbar-user">
            {user?.name ? user.name.split(' ')[0] : (isDoctor ? 'Doctor' : 'Patient')}
          </span>
          <button className="mc-navbar-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}