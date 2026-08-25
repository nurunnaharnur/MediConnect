import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Reminders from './pages/Reminders';
   import HospitalFinder from './pages/HospitalFinder';
   import DoctorProfile from './pages/DoctorProfile';
import { getToken } from './api/authApi';

// Simple guard: redirect to /login if there's no token yet.
function RequireAuth({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Reminders />
            </RequireAuth>
          }
        />
        <Route
          path="/hospitals"
          element={
            <RequireAuth>
              <HospitalFinder />
            </RequireAuth>
          }
        />
        <Route
          path="/doctors/:id"
          element={
            <RequireAuth>
              <DoctorProfile />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;