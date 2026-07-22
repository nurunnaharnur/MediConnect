// COMPLETE FILE
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Reminders from './pages/Reminders';
import Appointments from './pages/Appointments';
import GenerateReport from './pages/GenerateReport';
import ReportHistory from './pages/ReportHistory';
import SymptomHistory from './pages/SymptomHistory';
import Layout from './components/Layout';
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
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Reminders />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/reports/generate" element={<GenerateReport />} />
          <Route path="/reports/history" element={<ReportHistory />} />
          <Route path="/symptoms" element={<SymptomHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;