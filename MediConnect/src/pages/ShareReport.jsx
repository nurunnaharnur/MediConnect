import { useEffect, useState } from 'react';
import { fetchReportHistory } from '../api/healthReportApi';
import { fetchAppointments } from '../api/appointmentApi';
import { fetchDoctors } from '../api/doctorApi';
import { shareReport, fetchMySharedReports } from '../api/sharedReportApi';
import '../styles/ShareReport.css';

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ShareReport() {
  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ reportId: '', doctorId: '', appointmentId: '' });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [reportData, doctorData, appointmentData, sharedData] = await Promise.all([
          fetchReportHistory(),
          fetchDoctors(),
          fetchAppointments(),
          fetchMySharedReports(),
        ]);
        if (isMounted) {
          setReports(Array.isArray(reportData) ? reportData : []);
          setDoctors(Array.isArray(doctorData) ? doctorData : []);
          setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
          setShared(Array.isArray(sharedData) ? sharedData : []);
        }
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

  async function handleShare(e) {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!form.reportId || !form.doctorId) {
      setFormError('Please select both a health report and a doctor to share with.');
      return;
    }

    setSaving(true);
    try {
      await shareReport({
        reportId: form.reportId,
        doctorId: form.doctorId,
        appointmentId: form.appointmentId || undefined,
      });
      setSuccessMsg('Report shared exclusively with your designated doctor.');
      setForm({ reportId: '', doctorId: '', appointmentId: '' });
      const sharedData = await fetchMySharedReports();
      setShared(Array.isArray(sharedData) ? sharedData : []);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="share-page">
      <div className="share-shell">
        <p className="share-eyebrow">Confidential Care Coordination</p>
        <h1>Share Health Report with Doctor</h1>
        <p className="share-subtext" style={{ color: '#5B6B65', margin: '0 0 1.5rem' }}>
          Grant specific, authorized access for your attending physician to review your disease clinical summaries, vitals, and diagnostic histories.
        </p>

        {error && <div className="share-error-banner">{error}</div>}

        {loading ? (
          <p className="share-muted">Loading reports and physicians…</p>
        ) : (
          <>
            <form className="share-form" onSubmit={handleShare}>
              <div className="share-field">
                <label htmlFor="reportId">Select Health Report</label>
                <select
                  id="reportId"
                  value={form.reportId}
                  onChange={(e) => setForm((f) => ({ ...f, reportId: e.target.value }))}
                >
                  <option value="">Choose a generated report</option>
                  {reports.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.diseaseFocus || 'General'} — {formatDate(r.generatedAt)} ({r.severity}) — {r.symptoms.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="share-field">
                <label htmlFor="doctorId">Designate Doctor</label>
                <select
                  id="doctorId"
                  value={form.doctorId}
                  onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                >
                  <option value="">Select attending doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.name}{d.specialty || d.specialization ? ` — ${d.specialty || d.specialization}` : ''}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && (
                  <p className="share-hint">No registered doctors found.</p>
                )}
              </div>

              <div className="share-field">
                <label htmlFor="appointmentId">Related Appointment (Optional)</label>
                <select
                  id="appointmentId"
                  value={form.appointmentId}
                  onChange={(e) => setForm((f) => ({ ...f, appointmentId: e.target.value }))}
                >
                  <option value="">None (General Consultation)</option>
                  {appointments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {formatDate(a.date)} — {a.doctorName}
                    </option>
                  ))}
                </select>
              </div>

              {formError && <p className="share-form-error">{formError}</p>}
              {successMsg && <p className="share-form-success">{successMsg}</p>}

              <button type="submit" className="share-btn-primary" disabled={saving}>
                {saving ? 'Sharing securely…' : '🔒 Share Exclusively With Doctor'}
              </button>
            </form>

            <h2 className="share-history-title">Sharing History &amp; Access Log</h2>
            {shared.length === 0 ? (
              <div className="share-empty">
                <p className="share-empty-title">No Reports Shared Yet</p>
                <p>When you designate a health report for a doctor, the access log will appear here.</p>
              </div>
            ) : (
              <div className="share-list">
                {shared.map((s) => (
                  <div key={s._id} className="share-card">
                    <div className="share-card-main">
                      <div>
                        <div className="share-card-doctor">
                          👨‍⚕️ Dr. {s.doctorId?.name}{s.doctorId?.specialization || s.doctorId?.specialty ? ` — ${s.doctorId.specialization || s.doctorId.specialty}` : ''}
                        </div>
                        <div className="share-card-report">
                          <strong style={{ color: '#146356' }}>
                            {s.reportId?.diseaseFocus || 'General Clinical Health'}
                          </strong>{' '}
                          ({s.reportId?.severity || 'Mild'} severity) from {formatDate(s.reportId?.generatedAt)}
                        </div>
                      </div>
                      <span className={`share-status-tag ${(s.status || 'shared').toLowerCase()}`}>{s.status}</span>
                    </div>
                    <div className="share-card-meta">Shared on {formatDate(s.sharedAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}