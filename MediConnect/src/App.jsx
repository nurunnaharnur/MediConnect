import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import MentalWellbeing from './pages/MentalWellbeing';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
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
        <Route
          path="/appointments"
          element={
            <RequirePatientAuth>
              <Appointments />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/reports/generate"
          element={
            <RequirePatientAuth>
              <GenerateReport />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/reports/history"
          element={
            <RequirePatientAuth>
              <ReportHistory />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/symptoms"
          element={
            <RequirePatientAuth>
              <SymptomHistory />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/cycles"
          element={
            <RequirePatientAuth>
              <CycleTracker />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/cycles/prediction"
          element={
            <RequirePatientAuth>
              <CyclePrediction />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/pcos"
          element={
            <RequirePatientAuth>
              <PcosCheck />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/reports/share"
          element={
            <RequirePatientAuth>
              <ShareReport />
            </RequirePatientAuth>
          }
        />
        <Route
          path="/diagnoses"
          element={
            <RequirePatientAuth>
              <MyDiagnoses />
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
        <Route
          path="/doctor/reports"
          element={
            <RequireDoctorAuth>
              <DoctorSharedReports />
            </RequireDoctorAuth>
          }
        />
        <Route
          path="/doctor/reports/:id"
          element={
            <RequireDoctorAuth>
              <DoctorReportDetail />
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