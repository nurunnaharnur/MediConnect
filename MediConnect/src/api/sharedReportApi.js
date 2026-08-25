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

// POST /api/shared-reports
export function shareReport(payload) {
  return request('/shared-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /api/shared-reports/mine
export function fetchMySharedReports() {
  return request('/shared-reports/mine');
}

// GET /api/shared-reports/received
export function fetchReportsSharedWithMe() {
  return request('/shared-reports/received');
}

// GET /api/shared-reports/:id
export function fetchSharedReportById(id) {
  return request(`/shared-reports/${id}`);
}