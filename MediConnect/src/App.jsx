import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import MentalWellbeing from './pages/MentalWellbeing';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import { getToken, getUser } from './api/authApi';

// Guard for Patient-accessible routes
function RequirePatientAuth({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  const user = getUser();
  if (user?.role === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />;
  }

  return children;
}

// Guard for Doctor-only routes
function RequireDoctorAuth({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/doctor-login" replace />;

  const user = getUser();
  if (user?.role !== 'doctor') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Smart root redirect based on logged in role
function RootRedirect() {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  const user = getUser();
  return user?.role === 'doctor' ? (
    <Navigate to="/doctor-dashboard" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        
        {/* Patient Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Doctor Auth */}
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor-register" element={<DoctorRegister />} />

        {/* Patient Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <RequirePatientAuth>
              <Dashboard />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/reminders"
          element={
            <RequirePatientAuth>
              <Reminders />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/mental-wellbeing"
          element={
            <RequirePatientAuth>
              <MentalWellbeing />
            </RequirePatientAuth>
          }
        />

        {/* Doctor Protected Routes */}
        <Route
          path="/doctor-dashboard"
          element={
            <RequireDoctorAuth>
              <DoctorDashboard />
            </RequireDoctorAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;