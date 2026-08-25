// COMPLETE FILE
import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

// POST /api/reports/generate
export function generateReport({ symptoms, severity }) {
  return request('/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ symptoms, severity }),
  });
}

// GET /api/reports
export function fetchReportHistory() {
  return request('/reports');
}

// GET /api/reports/:id/download
// Downloads the PDF as a blob and triggers a browser save prompt.
export async function downloadReport(id, fileName) {
  const res = await fetch(`${API_BASE}/reports/${id}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Could not download the report.');
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