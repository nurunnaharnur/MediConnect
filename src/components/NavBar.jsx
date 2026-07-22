import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession } from '../api/authApi';
import '../styles/NavBar.css';

const LINKS = [
  { to: '/dashboard', label: 'Reminders' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/reports/generate', label: 'Generate Report' },
  { to: '/reports/history', label: 'Report History' },
  { to: '/symptoms', label: 'Symptom History' }
];

export default function NavBar() {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <nav className="mc-navbar">
      <div className="mc-navbar-inner">
        <span className="mc-navbar-brand">MediConnect</span>
        <div className="mc-navbar-links">
          {LINKS.map((link) => (
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