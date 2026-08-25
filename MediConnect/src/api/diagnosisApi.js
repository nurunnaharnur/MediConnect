import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

// POST /api/diagnoses
export function createDiagnosis(payload) {
  return request('/diagnoses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// PUT /api/diagnoses/:id
export function updateDiagnosis(id, payload) {
  return request(`/diagnoses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// GET /api/diagnoses/mine
export function fetchMyCreatedDiagnoses() {
  return request('/diagnoses/mine');
}

// GET /api/diagnoses/patient
export function fetchMyReceivedDiagnoses() {
  return request('/diagnoses/patient');
}

// GET /api/diagnoses/shared/:sharedReportId
export function fetchDiagnosesForSharedReport(sharedReportId) {
  return request(`/diagnoses/shared/${sharedReportId}`);
}