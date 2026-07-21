import { useEffect, useMemo, useState } from 'react';
import {
  fetchReminders,
  createReminder,
  updateReminderStatus,
} from '../api/reminderApi';
import '../styles/Reminders.css';

const STATUS_LABELS = {
  taken: 'Taken',
  skipped: 'Skipped',
  snoozed: 'Snoozed',
};

const EMPTY_FORM = {
  name: '',
  dosage: '',
  time: '',
  frequency: 'daily',
  endDate: '',
};

function isCourseEnded(reminder) {
  if (!reminder.endDate) return false;
  const end = new Date(reminder.endDate);
  const today = new Date();
  end.setHours(23, 59, 59, 999);
  return end < today;
}

function formatTimeLabel(time) {
  // time is stored as "HH:MM" — render as a 12-hour label for readability
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesFromMidnight(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function findNextDose(reminders) {
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = reminders
    .filter((r) => r.status === 'scheduled' && !isCourseEnded(r))
    .filter((r) => minutesFromMidnight(r.time) >= nowMinutes)
    .sort((a, b) => minutesFromMidnight(a.time) - minutesFromMidnight(b.time));
  return upcoming[0] || null;
}

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchReminders();
      setReminders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => minutesFromMidnight(a.time) - minutesFromMidnight(b.time)),
    [reminders]
  );

  const nextDose = useMemo(() => findNextDose(reminders), [reminders]);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    const previous = reminders;
    // Optimistic update so the timeline responds immediately
    setReminders((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
    try {
      await updateReminderStatus(id, status);
    } catch (err) {
      setReminders(previous);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.name || !form.dosage || !form.time || !form.endDate) {
      setFormError('Fill in every field before saving.');
      return;
    }

    setSaving(true);
    try {
      const created = await createReminder(form);
      setReminders((rs) => [...rs, created]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reminders-page">
      <div className="rem-shell">
        <div className="rem-header">
          <div>
            <p className="rem-eyebrow">Today's schedule</p>
            <h1>Medicine reminders</h1>
          </div>
          <button className="rem-add-btn" onClick={() => setShowForm(true)}>
            + Add reminder
          </button>
        </div>

        {error && <div className="rem-error-banner">{error}</div>}

        {/* Hero: next scheduled dose */}
        <div className="rem-hero">
          <p className="rem-hero-label">Next dose</p>
          {nextDose ? (
            <div className="rem-hero-main">
              <span className="rem-hero-time">{formatTimeLabel(nextDose.time)}</span>
              <span className="rem-hero-name">{nextDose.name}</span>
              <span className="rem-hero-dose">{nextDose.dosage}</span>
            </div>
          ) : (
            <p className="rem-hero-empty">
              {loading ? 'Loading your schedule…' : 'Nothing left to take today.'}
            </p>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading reminders…</p>
        ) : sortedReminders.length === 0 ? (
          <div className="rem-empty">
            <p className="rem-empty-title">No reminders yet</p>
            <p>Add your first medicine to start building today's timeline.</p>
          </div>
        ) : (
          <>
            <p className="rem-section-label">Timeline</p>
            <div className="rem-timeline">
              {sortedReminders.map((r) => {
                const ended = isCourseEnded(r);
                return (
                  <div
                    key={r._id}
                    className={`rem-dose status-${r.status}${ended ? ' status-ended' : ''}`}
                  >
                    <div className="rem-dose-left">
                      <span className="rem-dose-time">{formatTimeLabel(r.time)}</span>
                      <div>
                        <div className="rem-dose-name">{r.name}</div>
                        <div className="rem-dose-meta">
                          {r.dosage} · {r.frequency}
                          {ended ? ' · course ended' : ''}
                        </div>
                      </div>
                    </div>

                    {ended ? (
                      <span className="rem-status-tag ended">Course ended</span>
                    ) : (
                      <div className="rem-dose-actions">
                        {['taken', 'skipped', 'snoozed'].map((status) => (
                          <button
                            key={status}
                            className={`rem-pill-btn ${status}${r.status === status ? ' active' : ''}`}
                            disabled={updatingId === r._id}
                            onClick={() => handleStatusChange(r._id, status)}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="rem-overlay" onClick={() => setShowForm(false)}>
          <div className="rem-form-card" onClick={(e) => e.stopPropagation()}>
            <h2>Add a reminder</h2>
            <form onSubmit={handleSubmit}>
              <div className="rem-field">
                <label htmlFor="name">Medicine name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Metformin"
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </div>

              <div className="rem-field">
                <label htmlFor="dosage">Dosage</label>
                <input
                  id="dosage"
                  type="text"
                  placeholder="e.g. 500mg, 1 tablet"
                  value={form.dosage}
                  onChange={(e) => handleFormChange('dosage', e.target.value)}
                />
              </div>

              <div className="rem-field-row">
                <div className="rem-field">
                  <label htmlFor="time">Time</label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                  />
                </div>
                <div className="rem-field">
                  <label htmlFor="frequency">Frequency</label>
                  <select
                    id="frequency"
                    value={form.frequency}
                    onChange={(e) => handleFormChange('frequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="rem-field">
                <label htmlFor="endDate">Stop after (course end date)</label>
                <input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                />
              </div>

              {formError && <p style={{ color: 'var(--skipped)', fontSize: '0.85rem' }}>{formError}</p>}

              <div className="rem-form-actions">
                <button
                  type="button"
                  className="rem-btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="rem-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}