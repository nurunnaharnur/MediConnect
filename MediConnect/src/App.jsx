import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Reminders from './pages/Reminders';
import SymptomChecker from './pages/SymptomChecker';
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
     path="/symptom-checker"
     element={
       <RequireAuth>
         <SymptomChecker />
       </RequireAuth>
     }
   />
      </Routes>
    </BrowserRouter>
  );
}

export default App;