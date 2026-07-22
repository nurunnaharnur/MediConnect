import { useEffect, useMemo, useState } from 'react';
import {
  fetchAppointments,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
} from '../api/appointmentApi';
import '../styles/Appointments.css';

const EMPTY_FORM = { doctorName: '', department: '', date: '', time: '', reason: '' };
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
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments]
  );

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
            <p className="appt-eyebrow">Your care</p>
            <h1>Appointments</h1>
          </div>
          <button className="appt-add-btn" onClick={() => setShowForm(true)}>
            + Book appointment
          </button>
        </div>

        {error && <div className="appt-error-banner">{error}</div>}

        {loading ? (
          <p className="appt-muted">Loading appointments…</p>
        ) : sorted.length === 0 ? (
          <div className="appt-empty">
            <p className="appt-empty-title">No appointments yet</p>
            <p>Book your first appointment to see it here.</p>
          </div>
        ) : (
          <div className="appt-list">
            {sorted.map((appt) => (
              <div key={appt._id} className={`appt-card status-${appt.status.toLowerCase()}`}>
                <div className="appt-card-main">
                  <div className="appt-card-date">
                    <span className="appt-card-day">{formatDate(appt.date)}</span>
                    <span className="appt-card-time">{appt.time}</span>
                  </div>
                  <div className="appt-card-info">
                    <div className="appt-card-doctor">{appt.doctorName}</div>
                    {appt.department && <div className="appt-card-dept">{appt.department}</div>}
                    {appt.reason && <div className="appt-card-reason">{appt.reason}</div>}
                  </div>
                  <span className={`appt-status-tag ${appt.status.toLowerCase()}`}>{appt.status}</span>
                </div>

                {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
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
            <h2>Book an appointment</h2>
            <form onSubmit={handleBook}>
              <div className="appt-field">
                <label htmlFor="doctorName">Doctor name</label>
                <input
                  id="doctorName"
                  type="text"
                  placeholder="Dr. Sarah Ahmed"
                  value={form.doctorName}
                  onChange={(e) => handleFormChange('doctorName', e.target.value)}
                />
              </div>

              <div className="appt-field">
                <label htmlFor="department">Department (optional)</label>
                <input
                  id="department"
                  type="text"
                  placeholder="Cardiology"
                  value={form.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                />
              </div>

              <div className="appt-field-row">
                <div className="appt-field">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </div>
                <div className="appt-field">
                  <label htmlFor="time">Time</label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                  />
                </div>
              </div>

              <div className="appt-field">
                <label htmlFor="reason">Reason for visit (optional)</label>
                <textarea
                  id="reason"
                  placeholder="Follow-up checkup"
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
                  {saving ? 'Booking…' : 'Book appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}