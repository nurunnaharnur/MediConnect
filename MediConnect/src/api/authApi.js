const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const getToken = () => localStorage.getItem('mc_token');

export const getUser = () => {
  try {
    const raw = localStorage.getItem('mc_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return { ...user, role: user.role || 'patient' };
  } catch {
    return null;
  }
};

export const saveSession = (data) => {
  if (data.token) {
    localStorage.setItem('mc_token', data.token);
  }
  localStorage.setItem(
    'mc_user',
    JSON.stringify({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role || 'patient',
      specialization: data.specialization || '',
      qualification: data.qualification || '',
      licenseNumber: data.licenseNumber || '',
      age: data.age || 0,
      gender: data.gender || '',
      height: data.height || 0,
      weight: data.weight || 0,
      medicalHistory: data.medicalHistory || '',
      emergencyContact: data.emergencyContact || { name: '', email: '', phone: '', relationship: '' }
    })
  );
};

export const clearSession = () => {
  localStorage.removeItem('mc_token');
  localStorage.removeItem('mc_user');
};

async function authRequest(endpoint, payload, method = 'POST') {
  let res;
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };
    if (payload && method !== 'GET') {
      options.body = JSON.stringify(payload);
    }

    res = await fetch(`${API_BASE}${endpoint}`, options);
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

// Patient Auth
export const registerUser = (payload) => authRequest('/auth/register', payload, 'POST');
export const loginUser = (payload) => authRequest('/auth/login', payload, 'POST');

// Doctor Auth
export const registerDoctor = (payload) => authRequest('/auth/doctor-register', payload, 'POST');
export const loginDoctor = (payload) => authRequest('/auth/doctor-login', payload, 'POST');

// Profile & Fresh State
export const fetchUserProfile = () => authRequest('/auth/me', null, 'GET');

// Emergency Contact & Alerts
export const updateEmergencyContact = (payload) => authRequest('/auth/emergency-contact', payload, 'PUT');
export const sendEmergencyAlert = (payload) => authRequest('/auth/emergency-alert', payload, 'POST');

// Personalized Health Tips
export const fetchPersonalizedHealthTips = () => authRequest('/auth/health-tips', null, 'GET');
export const getHealthTips = fetchPersonalizedHealthTips;

// Download Full Patient Health Record & Profile PDF
export const downloadComprehensiveHealthProfilePDF = async (userName = 'Patient') => {
  const token = getToken();
  const res = await fetch(`${API_BASE}/auth/health-profile/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to download health profile PDF.');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MediConnect_Health_Profile_${userName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
