import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchReminders,
  createReminder,
  updateReminderStatus,
  testReminderEmail,
} from '../api/reminderApi';
import { getUser, clearSession } from '../api/authApi';
import '../styles/Reminders.css';

const STATUS_LABELS = {
  taken: 'Taken',
  skipped: 'Skipped',
  snoozed: 'Snoozed',
};

const MEAL_OPTIONS = [
  { value: 'other', label: 'None / No specific meal' },
  { value: 'before_breakfast', label: 'Before Breakfast' },
  { value: 'after_breakfast', label: 'After Breakfast' },
  { value: 'before_lunch', label: 'Before Lunch' },
  { value: 'after_lunch', label: 'After Lunch' },
  { value: 'before_dinner', label: 'Before Dinner' },
  { value: 'after_dinner', label: 'After Dinner' },
  { value: 'bedtime', label: 'At Bedtime' },
];

const EMPTY_FORM = {
  name: '',
  dosage: '',
  time: '',
  mealSegment: 'other',
  notes: '',
  emailNotification: true,
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
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesFromMidnight(time) {
  if (!time) return 0;
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
  const navigate = useNavigate();
  const [user] = useState(() => getUser());
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState({ text: '', isError: false });

  async function handleTestEmail(id) {
    setSendingEmailId(id);
    setEmailFeedback({ text: '', isError: false });
    try {
      const res = await testReminderEmail(id);
      setEmailFeedback({ text: res.message || 'Test email sent successfully! Check your inbox.', isError: false });
    } catch (err) {
      setEmailFeedback({ text: err.message, isError: true });
    } finally {
      setSendingEmailId(null);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchAllReminders() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchReminders();
        if (isMounted) {
          setReminders(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllReminders();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => minutesFromMidnight(a.time) - minutesFromMidnight(b.time)),
    [reminders]
  );

  const nextDose = useMemo(() => findNextDose(reminders), [reminders]);

  async function handleStatusChange(id, status) {
    setUpdatingId(id);
    const previous = reminders;
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
      setFormError('Fill in all required fields before saving.');
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
        {/* Navigation Bar */}
        <div className="rem-nav-bar">
          <button className="rem-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <div className="rem-nav-user">
            <span className="rem-user-name">{user?.name || 'Patient'}</span>
            <button
              className="rem-logout-btn"
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </div>
        </div>

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
        {emailFeedback.text && (
          <div
            className="rem-error-banner"
            style={{
              background: emailFeedback.isError ? 'var(--skipped-soft)' : 'var(--taken-soft)',
              color: emailFeedback.isError ? 'var(--skipped)' : 'var(--taken)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{emailFeedback.text}</span>
            <button
              type="button"
              onClick={() => setEmailFeedback({ text: '', isError: false })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

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
                const mealOption = MEAL_OPTIONS.find((m) => m.value === r.mealSegment);
                const showMealBadge = mealOption && r.mealSegment && r.mealSegment !== 'other';
                return (
                  <div
                    key={r._id}
                    className={`rem-dose status-${r.status}${ended ? ' status-ended' : ''}`}
                  >
                    <div className="rem-dose-left">
                      <span className="rem-dose-time">{formatTimeLabel(r.time)}</span>
                      <div>
                        <div className="rem-dose-name">
                          {r.name}
                          {showMealBadge && <span className="rem-meal-badge">{mealOption.label}</span>}
                        </div>
                        <div className="rem-dose-meta">
                          {r.dosage} · {r.frequency}
                          {ended ? ' · course ended' : ''}
                        </div>
                        {r.notes && <div className="rem-notes-text">📌 {r.notes}</div>}
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
                        <button
                          type="button"
                          className="rem-pill-btn"
                          title="Send a test notification email now"
                          disabled={sendingEmailId === r._id}
                          onClick={() => handleTestEmail(r._id)}
                          style={{ borderColor: 'var(--rail)', fontSize: '0.75rem' }}
                        >
                          {sendingEmailId === r._id ? 'Sending…' : '✉️ Test Email'}
                        </button>
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
                  <label htmlFor="mealSegment">Meal timing</label>
                  <select
                    id="mealSegment"
                    value={form.mealSegment}
                    onChange={(e) => handleFormChange('mealSegment', e.target.value)}
                  >
                    {MEAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rem-field">
                <label htmlFor="notes">Notes / Instructions</label>
                <input
                  id="notes"
                  type="text"
                  placeholder="e.g. Take after meals with glass of water"
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>

              <div className="rem-field-row">
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
                <div className="rem-field">
                  <label htmlFor="endDate">Course end date</label>
                  <input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="rem-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                <input
                  id="emailNotification"
                  type="checkbox"
                  checked={form.emailNotification}
                  onChange={(e) => handleFormChange('emailNotification', e.target.checked)}
                  style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                />
                <label htmlFor="emailNotification" style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem' }}>
                  Send email notification at dose time
                </label>
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