import { useEffect, useState } from 'react';
import {
  fetchCycles,
  createCycle,
  updateCycle,
  deleteCycle,
} from '../api/menstrualCycleApi';
import '../styles/CycleTracker.css';

const FLOW_LEVELS = ['Spotting', 'Light', 'Medium', 'Heavy'];

const EMPTY_FORM = {
  periodStartDate: '',
  periodEndDate: '',
  flowLevel: 'Medium',
  symptoms: '',
  notes: '',
  dailyFlow: [],
};

function toInputDate(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : '';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CycleTracker() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCycles();
      setCycles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(cycle) {
    setEditingId(cycle._id);
    setForm({
      periodStartDate: toInputDate(cycle.periodStartDate),
      periodEndDate: toInputDate(cycle.periodEndDate),
      flowLevel: cycle.flowLevel || 'Medium',
      symptoms: (cycle.symptoms || []).join(', '),
      notes: cycle.notes || '',
      dailyFlow: (cycle.dailyFlow || []).map((d) => ({
        date: toInputDate(d.date),
        flowLevel: d.flowLevel,
        notes: d.notes || '',
      })),
    });
    setFormError('');
    setShowForm(true);
  }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addDailyFlowRow() {
    setForm((f) => ({
      ...f,
      dailyFlow: [...f.dailyFlow, { date: f.periodStartDate || '', flowLevel: 'Medium', notes: '' }],
    }));
  }

  function updateDailyFlowRow(index, field, value) {
    setForm((f) => {
      const dailyFlow = [...f.dailyFlow];
      dailyFlow[index] = { ...dailyFlow[index], [field]: value };
      return { ...f, dailyFlow };
    });
  }

  function removeDailyFlowRow(index) {
    setForm((f) => ({ ...f, dailyFlow: f.dailyFlow.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.periodStartDate) {
      setFormError('Period start date is required.');
      return;
    }
    if (form.periodEndDate && form.periodEndDate < form.periodStartDate) {
      setFormError('Period end date cannot be before the start date.');
      return;
    }

    const payload = {
      periodStartDate: form.periodStartDate,
      periodEndDate: form.periodEndDate || null,
      flowLevel: form.flowLevel,
      symptoms: form.symptoms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      notes: form.notes,
      dailyFlow: form.dailyFlow.filter((d) => d.date && d.flowLevel),
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateCycle(editingId, payload);
        setCycles((list) => list.map((c) => (c._id === editingId ? updated : c)));
      } else {
        const created = await createCycle(payload);
        setCycles((list) => [created, ...list]);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this cycle record? This cannot be undone.')) return;
    setBusyId(id);
    setError('');
    try {
      await deleteCycle(id);
      setCycles((list) => list.filter((c) => c._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="cycle-page">
      <div className="cycle-shell">
        <div className="cycle-header">
          <div>
            <p className="cycle-eyebrow">Menstrual health</p>
            <h1>Cycle Tracker</h1>
          </div>
          <button className="cycle-add-btn" onClick={openAddForm}>
            + Log a period
          </button>
        </div>

        {error && <div className="cycle-error-banner">{error}</div>}

        {loading ? (
          <p className="cycle-muted">Loading cycle history…</p>
        ) : cycles.length === 0 ? (
          <div className="cycle-empty">
            <p className="cycle-empty-title">No cycles logged yet</p>
            <p>Log your first period to start building your cycle history.</p>
          </div>
        ) : (
          <div className="cycle-list">
            {cycles.map((cycle) => (
              <div key={cycle._id} className="cycle-card">
                <div className="cycle-card-main">
                  <div className="cycle-card-dates">
                    <span className="cycle-card-start">{formatDate(cycle.periodStartDate)}</span>
                    <span className="cycle-card-arrow">→</span>
                    <span className="cycle-card-end">
                      {cycle.periodEndDate ? formatDate(cycle.periodEndDate) : 'Ongoing'}
                    </span>
                  </div>
                  <span className={`cycle-flow-tag flow-${cycle.flowLevel.toLowerCase()}`}>
                    {cycle.flowLevel}
                  </span>
                </div>

                {cycle.symptoms?.length > 0 && (
                  <div className="cycle-symptoms">
                    {cycle.symptoms.map((s) => (
                      <span key={s} className="cycle-symptom-chip">{s}</span>
                    ))}
                  </div>
                )}

                {cycle.notes && <p className="cycle-notes">{cycle.notes}</p>}

                {cycle.dailyFlow?.length > 0 && (
                  <div className="cycle-daily-flow">
                    <p className="cycle-daily-flow-title">Daily flow</p>
                    {cycle.dailyFlow.map((d, i) => (
                      <div key={i} className="cycle-daily-flow-row">
                        <span>{formatDate(d.date)}</span>
                        <span className={`cycle-flow-tag flow-${d.flowLevel.toLowerCase()}`}>{d.flowLevel}</span>
                        {d.notes && <span className="cycle-daily-flow-notes">{d.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="cycle-card-actions">
                  <button className="cycle-btn-secondary" onClick={() => openEditForm(cycle)}>
                    Edit
                  </button>
                  <button
                    className="cycle-btn-danger"
                    disabled={busyId === cycle._id}
                    onClick={() => handleDelete(cycle._id)}
                  >
                    {busyId === cycle._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="cycle-overlay" onClick={() => setShowForm(false)}>
          <div className="cycle-form-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit cycle record' : 'Log a period'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="cycle-field-row">
                <div className="cycle-field">
                  <label htmlFor="periodStartDate">Period start date</label>
                  <input
                    id="periodStartDate"
                    type="date"
                    value={form.periodStartDate}
                    onChange={(e) => handleFormChange('periodStartDate', e.target.value)}
                  />
                </div>
                <div className="cycle-field">
                  <label htmlFor="periodEndDate">Period end date (optional)</label>
                  <input
                    id="periodEndDate"
                    type="date"
                    value={form.periodEndDate}
                    onChange={(e) => handleFormChange('periodEndDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="cycle-field">
                <label htmlFor="flowLevel">Overall flow</label>
                <select
                  id="flowLevel"
                  value={form.flowLevel}
                  onChange={(e) => handleFormChange('flowLevel', e.target.value)}
                >
                  {FLOW_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="cycle-field">
                <label htmlFor="symptoms">Symptoms (optional, comma separated)</label>
                <input
                  id="symptoms"
                  type="text"
                  placeholder="cramps, bloating, headache"
                  value={form.symptoms}
                  onChange={(e) => handleFormChange('symptoms', e.target.value)}
                />
              </div>

              <div className="cycle-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  placeholder="Anything else worth remembering about this cycle"
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>

              <div className="cycle-daily-flow-editor">
                <div className="cycle-daily-flow-editor-header">
                  <label>Daily flow (optional)</label>
                  <button type="button" className="cycle-btn-secondary" onClick={addDailyFlowRow}>
                    + Add day
                  </button>
                </div>
                {form.dailyFlow.map((row, index) => (
                  <div key={index} className="cycle-daily-flow-editor-row">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateDailyFlowRow(index, 'date', e.target.value)}
                    />
                    <select
                      value={row.flowLevel}
                      onChange={(e) => updateDailyFlowRow(index, 'flowLevel', e.target.value)}
                    >
                      {FLOW_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Notes"
                      value={row.notes}
                      onChange={(e) => updateDailyFlowRow(index, 'notes', e.target.value)}
                    />
                    <button type="button" className="cycle-remove-row" onClick={() => removeDailyFlowRow(index)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {formError && <p className="cycle-form-error">{formError}</p>}

              <div className="cycle-form-actions">
                <button type="button" className="cycle-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="cycle-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Log period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}