import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function symptomRequest(path, options = {}) {
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
    throw new Error('Cannot reach the MediConnect server on port 5001. Check connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Symptom request failed.');
  }
  return data;
}

export const fetchSymptomOptions = () =>
  symptomRequest('/symptom-check/options');

export const runSymptomCheck = (payload) =>
  symptomRequest('/symptom-check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getSymptomCheckHistory = () =>
  symptomRequest('/symptom-check');

export const clearSymptomCheckHistory = () =>
  symptomRequest('/symptom-check', {
    method: 'DELETE',
  });
