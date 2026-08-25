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
          setReports(reportData);
          setDoctors(doctorData);
          setAppointments(appointmentData);
          setShared(sharedData);
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
      setFormError('Choose a report and a doctor.');
      return;
    }

    setSaving(true);
    try {
      await shareReport({
        reportId: form.reportId,
        doctorId: form.doctorId,
        appointmentId: form.appointmentId || undefined,
      });
      setSuccessMsg('Report shared successfully.');
      setForm({ reportId: '', doctorId: '', appointmentId: '' });
      const sharedData = await fetchMySharedReports();
      setShared(sharedData);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="share-page">
      <div className="share-shell">
        <p className="share-eyebrow">Care coordination</p>
        <h1>Share a Health Report</h1>

        {error && <div className="share-error-banner">{error}</div>}

        {loading ? (
          <p className="share-muted">Loading…</p>
        ) : (
          <>
            <form className="share-form" onSubmit={handleShare}>
              <div className="share-field">
                <label htmlFor="reportId">Report</label>
                <select
                  id="reportId"
                  value={form.reportId}
                  onChange={(e) => setForm((f) => ({ ...f, reportId: e.target.value }))}
                >
                  <option value="">Select a report</option>
                  {reports.map((r) => (
                    <option key={r._id} value={r._id}>
                      {formatDate(r.generatedAt)} — {r.severity} — {r.symptoms.slice(0, 40)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="share-field">
                <label htmlFor="doctorId">Doctor</label>
                <select
                  id="doctorId"
                  value={form.doctorId}
                  onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && (
                  <p className="share-hint">No doctors have registered on MediConnect yet.</p>
                )}
              </div>

              <div className="share-field">
                <label htmlFor="appointmentId">Related appointment (optional)</label>
                <select
                  id="appointmentId"
                  value={form.appointmentId}
                  onChange={(e) => setForm((f) => ({ ...f, appointmentId: e.target.value }))}
                >
                  <option value="">None</option>
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
                {saving ? 'Sharing…' : 'Share report'}
              </button>
            </form>

            <h2 className="share-history-title">Sharing history</h2>
            {shared.length === 0 ? (
              <div className="share-empty">
                <p className="share-empty-title">No reports shared yet</p>
                <p>Reports you share with a doctor will show up here.</p>
              </div>
            ) : (
              <div className="share-list">
                {shared.map((s) => (
                  <div key={s._id} className="share-card">
                    <div className="share-card-main">
                      <div>
                        <div className="share-card-doctor">
                          Dr. {s.doctorId?.name}{s.doctorId?.specialization ? ` — ${s.doctorId.specialization}` : ''}
                        </div>
                        <div className="share-card-report">
                          {s.reportId?.severity} report from {formatDate(s.reportId?.generatedAt)}
                        </div>
                      </div>
                      <span className={`share-status-tag ${s.status.toLowerCase()}`}>{s.status}</span>
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