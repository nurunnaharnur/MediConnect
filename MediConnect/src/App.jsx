import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Reminders from './pages/Reminders';
import Appointments from './pages/Appointments';
import GenerateReport from './pages/GenerateReport';
import ReportHistory from './pages/ReportHistory';
import SymptomHistory from './pages/SymptomHistory';
import CycleTracker from './pages/CycleTracker';
import CyclePrediction from './pages/CyclePrediction';
import PcosCheck from './pages/PcosCheck';
import ShareReport from './pages/ShareReport';
import MyDiagnoses from './pages/MyDiagnoses';
import DoctorSharedReports from './pages/DoctorSharedReports';
import DoctorReportDetail from './pages/DoctorReportDetail';
import Layout from './components/Layout';
import { getToken, getUser } from './api/authApi';

// Simple guard: redirect to /login if there's no token yet.
function RequireAuth({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

// Restricts a route to one or more roles. Must be nested inside RequireAuth.
function RequireRole({ roles, children }) {
  const user = getUser();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
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

          {/* Patient-only: menstrual health & report sharing */}
          <Route
            path="/cycles"
            element={<RequireRole roles={['patient']}><CycleTracker /></RequireRole>}
          />
          <Route
            path="/cycles/prediction"
            element={<RequireRole roles={['patient']}><CyclePrediction /></RequireRole>}
          />
          <Route
            path="/pcos"
            element={<RequireRole roles={['patient']}><PcosCheck /></RequireRole>}
          />
          <Route
            path="/reports/share"
            element={<RequireRole roles={['patient']}><ShareReport /></RequireRole>}
          />
          <Route
            path="/diagnoses"
            element={<RequireRole roles={['patient']}><MyDiagnoses /></RequireRole>}
          />

          {/* Doctor-only: shared reports & diagnosis/prescription workflow */}
          <Route
            path="/doctor/reports"
            element={<RequireRole roles={['doctor']}><DoctorSharedReports /></RequireRole>}
          />
          <Route
            path="/doctor/reports/:id"
            element={<RequireRole roles={['doctor']}><DoctorReportDetail /></RequireRole>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;