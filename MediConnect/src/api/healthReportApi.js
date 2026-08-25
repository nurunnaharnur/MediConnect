import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function request(path, options = {}) {
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
    throw new Error('Cannot reach MediConnect backend server on port 5001. Please verify the server is running.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to communicate with health reports server.');
  }

  return data;
}

// POST /api/reports/generate (Supports Disease Focus & Exclusive Doctor Sharing)
export function generateReport(payload) {
  return request('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /api/reports
export function fetchReportHistory() {
  return request('/reports');
}

// GET /api/reports/:id/download
export async function downloadReport(id, fileName) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}/reports/${id}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    });
  } catch {
    throw new Error('Failed to reach server to download PDF.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Could not download the report PDF.');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'health-report.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}