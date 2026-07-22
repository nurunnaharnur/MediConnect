import { useEffect, useState } from 'react';
import { fetchReportHistory, downloadReport } from '../api/healthReportApi';
import '../styles/HealthReports.css';

export default function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchReportHistory();
      setReports(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(report) {
    setDownloadingId(report._id);
    setError('');
    try {
      await downloadReport(report._id, report.pdfFileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="hr-page">
      <div className="hr-shell">
        <p className="hr-eyebrow">Your records</p>
        <h1>Report history</h1>

        {error && <div className="hr-error-banner">{error}</div>}

        {loading ? (
          <p className="hr-muted">Loading reports…</p>
        ) : reports.length === 0 ? (
          <div className="hr-empty">
            <p className="hr-empty-title">No reports yet</p>
            <p>Generate your first health report to see it listed here.</p>
          </div>
        ) : (
          <div className="hr-report-list">
            {reports.map((report) => (
              <div key={report._id} className={`hr-report-card severity-${report.severity.toLowerCase()}`}>
                <div className="hr-report-main">
                  <div>
                    <p className="hr-report-date">
                      {new Date(report.generatedAt).toLocaleString()}
                    </p>
                    <p className="hr-report-symptoms">{report.symptoms}</p>
                  </div>
                  <span className={`hr-severity-tag ${report.severity.toLowerCase()}`}>
                    {report.severity}
                  </span>
                </div>
                <button
                  className="hr-btn-secondary"
                  onClick={() => handleDownload(report)}
                  disabled={downloadingId === report._id}
                >
                  {downloadingId === report._id ? 'Downloading…' : 'Download PDF'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}