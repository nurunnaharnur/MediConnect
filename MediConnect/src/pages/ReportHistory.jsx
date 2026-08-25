import { useEffect, useState } from 'react';
import { fetchReportHistory, downloadReport } from '../api/healthReportApi';
import '../styles/HealthReports.css';

export default function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchReportHistory();
        if (isMounted) setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

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
        <p className="hr-eyebrow">Clinical Records & Archival</p>
        <h1>Disease Health Report History</h1>
        <p className="hr-subtext">
          Access all your generated disease-focused reports, download archival PDFs, and verify physician designations.
        </p>

        {error && <div className="hr-error-banner">{error}</div>}

        {loading ? (
          <p className="hr-muted">Loading your clinical reports…</p>
        ) : reports.length === 0 ? (
          <div className="hr-empty">
            <p className="hr-empty-title">No Generated Reports Found</p>
            <p>Generate your first disease-focused health report to see it archived here.</p>
          </div>
        ) : (
          <div className="hr-report-list">
            {reports.map((report) => (
              <div key={report._id} className={`hr-report-card severity-${(report.severity || 'mild').toLowerCase()}`}>
                <div className="hr-report-main">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#146356' }}>
                        {report.diseaseFocus || 'General Clinical Health'}
                      </strong>
                      <span className="hr-report-date" style={{ margin: 0 }}>
                        • {new Date(report.generatedAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="hr-report-symptoms" style={{ color: '#374151', margin: '0 0 0.4rem' }}>
                      <strong>Symptoms:</strong> {report.symptoms}
                    </p>

                    {report.designatedDoctorName && (
                      <p style={{ fontSize: '0.8rem', color: '#15803D', margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>🔒 Shared with:</span>
                        <strong>Dr. {report.designatedDoctorName}</strong>
                        {report.designatedDoctorSpecialty ? `(${report.designatedDoctorSpecialty})` : ''}
                      </p>
                    )}
                  </div>

                  <span className={`hr-severity-tag ${(report.severity || 'mild').toLowerCase()}`}>
                    {report.severity}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.65rem' }}>
                  <button
                    className="hr-btn-secondary"
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report._id}
                  >
                    {downloadingId === report._id ? 'Downloading…' : '📥 Download PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}