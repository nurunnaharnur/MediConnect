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
import SymptomChecker from './pages/SymptomChecker';
import DietFitness from './pages/DietFitness';
import BloodPressure from './pages/BloodPressure';
import HospitalFinder from './pages/HospitalFinder';
import DoctorProfile from './pages/DoctorProfile';
import Layout from './components/Layout';
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
          element={
            <RequirePatientAuth>
              <Layout />
            </RequirePatientAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/mental-wellbeing" element={<MentalWellbeing />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/pcos" element={<PcosCheck />} />
          <Route path="/cycles" element={<CycleTracker />} />
          <Route path="/cycles/prediction" element={<CyclePrediction />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/diet-fitness" element={<DietFitness />} />
          <Route path="/blood-pressure" element={<BloodPressure />} />
          <Route path="/hospitals" element={<HospitalFinder />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/reports/generate" element={<GenerateReport />} />
          <Route path="/reports/history" element={<ReportHistory />} />
          <Route path="/symptoms" element={<SymptomHistory />} />
          <Route path="/reports/share" element={<ShareReport />} />
          <Route path="/diagnoses" element={<MyDiagnoses />} />
        </Route>

        {/* Doctor Protected Routes */}
        <Route
          element={
            <RequireDoctorAuth>
              <Layout />
            </RequireDoctorAuth>
          }
        >
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/reports" element={<DoctorSharedReports />} />
          <Route path="/doctor/reports/:id" element={<DoctorReportDetail />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;