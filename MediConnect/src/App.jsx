import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { getToken } from './api/authApi';

// Simple guard: redirect to /login if there's no token yet.
function RequireAuth({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

// Placeholder — swap this out for your real dashboard component.
function Dashboard() {
  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      <p>You're signed in. Build your reminders UI here.</p>
    </div>
  );
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
              <Dashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
