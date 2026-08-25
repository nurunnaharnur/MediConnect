import { useEffect, useMemo, useState } from 'react';
import {
  fetchAppointments,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  fetchAvailableDoctors,
} from '../api/appointmentApi';
import '../styles/Appointments.css';

const EMPTY_FORM = { doctorId: '', doctorName: '', department: '', date: '', time: '', reason: '' };
const EMPTY_RESCHEDULE = { date: '', time: '' };

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [reschedulingId, setReschedulingId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState(EMPTY_RESCHEDULE);
  const [rescheduleError, setRescheduleError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [apptData, docsData] = await Promise.all([
          fetchAppointments(),
          fetchAvailableDoctors().catch(() => []),
        ]);
        if (isMounted) {
          setAppointments(Array.isArray(apptData) ? apptData : []);
          setAvailableDoctors(Array.isArray(docsData) ? docsData : []);
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

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments]
  );

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSelectDoctor(e) {
    const docId = e.target.value;
    if (!docId) {
      setForm((f) => ({ ...f, doctorId: '', doctorName: '', department: '' }));
      return;
    }
    const doc = availableDoctors.find((d) => d._id === docId);
    if (doc) {
      setForm((f) => ({
        ...f,
        doctorId: doc._id,
        doctorName: doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`,
        department: doc.specialization || 'General Practice',
      }));
    }
  }

  async function handleBook(e) {
    e.preventDefault();
    setFormError('');
    if (!form.doctorName || !form.date || !form.time) {
      setFormError('Doctor name, date and time are required.');
      return;
    }
    setSaving(true);
    try {
      const created = await bookAppointment(form);
      setAppointments((list) => [...list, created]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startReschedule(appt) {
    setReschedulingId(appt._id);
    setRescheduleError('');
    setRescheduleForm({
      date: new Date(appt.date).toISOString().slice(0, 10),
      time: appt.time,
    });
  }

  async function submitReschedule(e, id) {
    e.preventDefault();
    setRescheduleError('');
    if (!rescheduleForm.date || !rescheduleForm.time) {
      setRescheduleError('Pick a date and time.');
      return;
    }
    setBusyId(id);
    try {
      const updated = await rescheduleAppointment(id, rescheduleForm);
      setAppointments((list) => list.map((a) => (a._id === id ? updated : a)));
      setReschedulingId(null);
    } catch (err) {
      setRescheduleError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id) {
    setBusyId(id);
    setError('');
    try {
      const updated = await cancelAppointment(id);
      setAppointments((list) => list.map((a) => (a._id === id ? updated : a)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="appt-page">
      <div className="appt-shell">
        <div className="appt-header">
          <div>
            <p className="appt-eyebrow">Clinical Consultations</p>
            <h1>Doctor Appointments</h1>
          </div>
          <button className="appt-add-btn" onClick={() => setShowForm(true)}>
            + Book Appointment
          </button>
        </div>

        {error && <div className="appt-error-banner">{error}</div>}

        {loading ? (
          <p className="appt-muted">Loading appointments…</p>
        ) : sorted.length === 0 ? (
          <div className="appt-empty">
            <span style={{ fontSize: '2.5rem' }}>📅</span>
            <p className="appt-empty-title">No appointments scheduled yet</p>
            <p>Book your first consultation with a registered MediConnect physician to see it here.</p>
          </div>
        ) : (
          <div className="appt-list">
            {sorted.map((appt) => (
              <div key={appt._id} className={`appt-card status-${(appt.status || 'scheduled').toLowerCase()}`}>
                <div className="appt-card-main">
                  <div className="appt-card-date">
                    <span className="appt-card-day">{formatDate(appt.date)}</span>
                    <span className="appt-card-time">{appt.time}</span>
                  </div>
                  <div className="appt-card-info">
                    <div className="appt-card-doctor">{appt.doctorName}</div>
                    {appt.department && <div className="appt-card-dept">{appt.department}</div>}
                    {appt.reason && <div className="appt-card-reason">{appt.reason}</div>}
                    {appt.clinicalNotes && (
                      <div style={{ fontSize: '0.8rem', color: '#0F5132', background: '#D1E7DD', padding: '0.35rem 0.65rem', borderRadius: '6px', marginTop: '0.4rem' }}>
                        📋 <strong>Doctor's Clinical Note:</strong> {appt.clinicalNotes}
                      </div>
                    )}
                  </div>
                  <span className={`appt-status-tag ${(appt.status || 'scheduled').toLowerCase()}`}>{appt.status}</span>
                </div>

                {appt.status !== 'Cancelled' && appt.status !== 'cancelled' && appt.status !== 'Completed' && (
                  <div className="appt-card-actions">
                    <button
                      className="appt-btn-secondary"
                      disabled={busyId === appt._id}
                      onClick={() => startReschedule(appt)}
                    >
                      Reschedule
                    </button>
                    <button
                      className="appt-btn-danger"
                      disabled={busyId === appt._id}
                      onClick={() => handleCancel(appt._id)}
                    >
                      {busyId === appt._id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}

                {reschedulingId === appt._id && (
                  <form className="appt-reschedule-form" onSubmit={(e) => submitReschedule(e, appt._id)}>
                    <div className="appt-field">
                      <label>New date</label>
                      <input
                        type="date"
                        value={rescheduleForm.date}
                        onChange={(e) => setRescheduleForm((f) => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="appt-field">
                      <label>New time</label>
                      <input
                        type="time"
                        value={rescheduleForm.time}
                        onChange={(e) => setRescheduleForm((f) => ({ ...f, time: e.target.value }))}
                      />
                    </div>
                    {rescheduleError && <p className="appt-form-error">{rescheduleError}</p>}
                    <div className="appt-reschedule-actions">
                      <button type="button" className="appt-btn-secondary" onClick={() => setReschedulingId(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="appt-btn-primary" disabled={busyId === appt._id}>
                        {busyId === appt._id ? 'Saving…' : 'Confirm'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="appt-overlay" onClick={() => setShowForm(false)}>
          <div className="appt-form-card" onClick={(e) => e.stopPropagation()}>
            <h2>Book a Physician Consultation</h2>
            <form onSubmit={handleBook}>
              {availableDoctors.length > 0 && (
                <div className="appt-field">
                  <label htmlFor="selectDoctorQuick">Select Registered Doctor</label>
                  <select
                    id="selectDoctorQuick"
                    value={form.doctorId}
                    onChange={handleSelectDoctor}
                    style={{ padding: '0.65rem', borderRadius: '10px', border: '1px solid #DDE4E2', background: '#F8FAFA' }}
                  >
                    <option value="">-- Choose from available physicians --</option>
                    {availableDoctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        👨‍⚕️ Dr. {d.name} — {d.specialization} ({d.hospitalName || 'General Clinic'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="appt-field">
                <label htmlFor="doctorName">Doctor Name &amp; Title</label>
                <input
                  id="doctorName"
                  type="text"
                  placeholder="e.g. Dr. Sarah Ahmed, MD"
                  value={form.doctorName}
                  onChange={(e) => handleFormChange('doctorName', e.target.value)}
                  required
                />
              </div>

              <div className="appt-field">
                <label htmlFor="department">Department / Specialty</label>
                <input
                  id="department"
                  type="text"
                  placeholder="e.g. Cardiology / Internal Medicine"
                  value={form.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                />
              </div>

              <div className="appt-field-row">
                <div className="appt-field">
                  <label htmlFor="date">Appointment Date</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    required
                  />
                </div>
                <div className="appt-field">
                  <label htmlFor="time">Preferred Time</label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="appt-field">
                <label htmlFor="reason">Reason for Visit &amp; Chief Complaint</label>
                <textarea
                  id="reason"
                  placeholder="Describe your health concern, symptoms, or reason for this consultation..."
                  value={form.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                />
              </div>

              {formError && <p className="appt-form-error">{formError}</p>}

              <div className="appt-form-actions">
                <button type="button" className="appt-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="appt-btn-primary" disabled={saving}>
                  {saving ? 'Scheduling Consultation…' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}