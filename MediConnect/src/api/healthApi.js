import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function healthRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot connect to backend server on port 5001. Ensure backend is running.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'API request failed.');
  }
  return data;
}

// Symptom Checker API
export const checkSymptoms = (payload) =>
  healthRequest('/symptom-checker/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getSymptomCheckHistory = () =>
  healthRequest('/symptom-checker/history');

export const clearSymptomCheckHistory = () =>
  healthRequest('/symptom-checker/history', { method: 'DELETE' });

// Diet & Nutrition Meals API
export const fetchMeals = () =>
  healthRequest('/health/meals');

export const logMeal = (payload) =>
  healthRequest('/health/meals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const clearMeals = () =>
  healthRequest('/health/logs?type=meals', { method: 'DELETE' });

// Workout / Fitness API
export const fetchWorkouts = () =>
  healthRequest('/health/workouts');

export const logWorkout = (payload) =>
  healthRequest('/health/workouts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const clearWorkouts = () =>
  healthRequest('/health/logs?type=workouts', { method: 'DELETE' });

// Blood Pressure Vitals API
export const fetchVitals = () =>
  healthRequest('/health/vitals');

export const logVital = (payload) =>
  healthRequest('/health/vitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const clearVitals = () =>
  healthRequest('/health/logs?type=vitals', { method: 'DELETE' });
