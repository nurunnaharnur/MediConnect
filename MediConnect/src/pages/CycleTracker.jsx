import { useEffect, useState } from 'react';
import {
  fetchCycles,
  createCycle,
  updateCycle,
  deleteCycle,
  fetchCyclePrediction,
} from '../api/menstrualCycleApi';
import { fetchPcosProfile, savePcosProfile, fetchPcosScreening } from '../api/pcosApi';
import '../styles/CycleTracker.css';
import '../styles/PcosCheck.css';

const FLOW_LEVELS = ['Spotting', 'Light', 'Medium', 'Heavy'];

const EMPTY_FORM = {
  periodStartDate: '',
  periodEndDate: '',
  flowLevel: 'Medium',
  symptoms: '',
  notes: '',
  dailyFlow: [],
};

const EMPTY_PCOS = {
  acne: false,
  excessHairGrowth: false,
  hairThinning: false,
  weightGain: false,
  skinDarkening: false,
  familyHistoryPCOS: false,
  notes: '',
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
  const [activeTab, setActiveTab] = useState('cycles'); // 'cycles', 'prediction', 'pcos'

  // Cycle States
  const [cycles, setCycles] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // PCOS States
  const [pcosProfile, setPcosProfile] = useState(EMPTY_PCOS);
  const [pcosScreening, setPcosScreening] = useState(null);
  const [pcosSaving, setPcosSaving] = useState(false);
  const [pcosSuccess, setPcosSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadAll() {
      try {
        const [cycleData, predData, pcosData, pcosScreen] = await Promise.all([
          fetchCycles().catch(() => []),
          fetchCyclePrediction().catch(() => null),
          fetchPcosProfile().catch(() => EMPTY_PCOS),
          fetchPcosScreening().catch(() => null),
        ]);
        if (isMounted) {
          setCycles(Array.isArray(cycleData) ? cycleData : []);
          setPrediction(predData);
          setPcosProfile({ ...EMPTY_PCOS, ...pcosData });
          setPcosScreening(pcosScreen);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

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
      const updatedPred = await fetchCyclePrediction().catch(() => null);
      setPrediction(updatedPred);
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
      const updatedPred = await fetchCyclePrediction().catch(() => null);
      setPrediction(updatedPred);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // PCOS Handlers
  function togglePcos(field) {
    setPcosProfile((p) => ({ ...p, [field]: !p[field] }));
  }

  async function handlePcosSubmit(e) {
    e.preventDefault();
    setPcosSaving(true);
    setError('');
    setPcosSuccess('');
    try {
      await savePcosProfile(pcosProfile);
      const screeningData = await fetchPcosScreening();
      setPcosScreening(screeningData);
      setPcosSuccess('Your PCOS symptom profile and screening results have been updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setPcosSaving(false);
    }
  }

  const pcosResultClass = pcosScreening
    ? pcosScreening.result === 'No pattern currently detected'
      ? 'none'
      : pcosScreening.result === 'Multiple PCOS-related patterns detected'
      ? 'multiple'
      : 'single'
    : '';

  return (
    <div className="cycle-page">
      <div className="cycle-shell">
        <div className="cycle-header">
          <div>
            <p className="cycle-eyebrow">Reproductive &amp; Hormonal Wellness</p>
            <h1>Menstruation &amp; Cycle Tracker</h1>
            <p style={{ color: '#5B6B65', fontSize: '0.92rem', margin: '0.25rem 0 0' }}>
              Track cycle phases, predict upcoming period &amp; fertile windows, and screen for PCOS risk patterns all in one place.
            </p>
          </div>
          {activeTab === 'cycles' && (
            <button className="cycle-add-btn" onClick={openAddForm}>
              + Log a period
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #E7ECEA', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`mc-quick-chip ${activeTab === 'cycles' ? 'active' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: activeTab === 'cycles' ? '#146356' : '#F1F5F4', color: activeTab === 'cycles' ? '#fff' : '#146356' }}
            onClick={() => setActiveTab('cycles')}
          >
            🗓️ Period Log &amp; History ({cycles.length})
          </button>
          <button
            type="button"
            className={`mc-quick-chip ${activeTab === 'prediction' ? 'active' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: activeTab === 'prediction' ? '#146356' : '#F1F5F4', color: activeTab === 'prediction' ? '#fff' : '#146356' }}
            onClick={() => setActiveTab('prediction')}
          >
            🔮 Predictions &amp; Fertile Window
          </button>
          <button
            type="button"
            className={`mc-quick-chip ${activeTab === 'pcos' ? 'active' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: activeTab === 'pcos' ? '#146356' : '#F1F5F4', color: activeTab === 'pcos' ? '#fff' : '#146356' }}
            onClick={() => setActiveTab('pcos')}
          >
            🌸 PCOS Pattern Screener
          </button>
        </div>

        {error && <div className="cycle-error-banner">{error}</div>}

        {/* TAB 1: CYCLES HISTORY */}
        {activeTab === 'cycles' && (
          <>
            {loading ? (
              <p className="cycle-muted">Loading cycle history…</p>
            ) : cycles.length === 0 ? (
              <div className="cycle-empty">
                <span style={{ fontSize: '2.5rem' }}>🌸</span>
                <p className="cycle-empty-title">No period cycles logged yet</p>
                <p>Log your first period to start tracking your cycle lengths and predictions.</p>
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
                        {cycle.flowLevel} Flow
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
                        <p className="cycle-daily-flow-title">Daily flow logs</p>
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
          </>
        )}

        {/* TAB 2: PREDICTIONS */}
        {activeTab === 'prediction' && (
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E7ECEA' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#146356', marginTop: 0 }}>
              🔮 Cycle Phase &amp; Fertile Window Predictions
            </h2>
            {!prediction || !prediction.nextPeriodEstimatedDate ? (
              <p style={{ color: '#5B6B65' }}>
                Log at least one period with start and end dates to calculate your estimated cycle length, fertile window, and next ovulation phase.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#F8FAFA', padding: '1rem', borderRadius: '12px', border: '1px solid #E7ECEA' }}>
                  <span style={{ fontSize: '0.8rem', color: '#5B6B65' }}>Estimated Cycle Length</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#146356', margin: '0.25rem 0 0' }}>
                    {prediction.averageCycleLengthDays || 28} Days
                  </p>
                </div>
                <div style={{ background: '#F8FAFA', padding: '1rem', borderRadius: '12px', border: '1px solid #E7ECEA' }}>
                  <span style={{ fontSize: '0.8rem', color: '#5B6B65' }}>Next Estimated Period</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#146356', margin: '0.25rem 0 0' }}>
                    {formatDate(prediction.nextPeriodEstimatedDate)}
                  </p>
                </div>
                {prediction.fertileWindowStartDate && (
                  <div style={{ background: '#FDF2F8', padding: '1rem', borderRadius: '12px', border: '1px solid #FBCFE8' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9D174D' }}>Estimated Fertile Window</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#BE185D', margin: '0.25rem 0 0' }}>
                      {formatDate(prediction.fertileWindowStartDate)} – {formatDate(prediction.fertileWindowEndDate)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PCOS PATTERN SCREENER */}
        {activeTab === 'pcos' && (
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E7ECEA' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#A8305C', marginTop: 0 }}>
              🌸 PCOS Pattern Screening &amp; Symptom Check
            </h2>
            <p style={{ color: '#5B6B65', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
              This screener evaluates your recorded cycle regularity along with self-reported androgenic indicators (acne, hair thinning, weight changes) to highlight potential PCOS risk patterns.
            </p>

            {pcosSuccess && <div className="pcos-success-banner">{pcosSuccess}</div>}

            {pcosScreening && (
              <div className={`pcos-result pcos-result-${pcosResultClass}`} style={{ marginBottom: '1.5rem' }}>
                <p className="pcos-result-title">{pcosScreening.result}</p>
                {pcosScreening.matchedFlags && pcosScreening.matchedFlags.length > 0 && (
                  <ul className="pcos-flag-list">
                    {pcosScreening.matchedFlags.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form className="pcos-form" onSubmit={handlePcosSubmit}>
              <h3>Self-Reported Hormonal &amp; Physical Indicators</h3>
              <p className="pcos-form-hint">Select any of the indicators below that apply to you:</p>

              <label className="pcos-checkbox">
                <input type="checkbox" checked={pcosProfile.acne} onChange={() => togglePcos('acne')} />
                Persistent adult acne or cystic breakouts
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={pcosProfile.excessHairGrowth}
                  onChange={() => togglePcos('excessHairGrowth')}
                />
                Excess facial or body hair growth (Hirsutism)
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={pcosProfile.hairThinning}
                  onChange={() => togglePcos('hairThinning')}
                />
                Scalp hair thinning or hair shedding
              </label>
              <label className="pcos-checkbox">
                <input type="checkbox" checked={pcosProfile.weightGain} onChange={() => togglePcos('weightGain')} />
                Unexplained weight gain or difficulty losing weight
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={pcosProfile.skinDarkening}
                  onChange={() => togglePcos('skinDarkening')}
                />
                Darkened skin patches (neck, underarms)
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={pcosProfile.familyHistoryPCOS}
                  onChange={() => togglePcos('familyHistoryPCOS')}
                />
                Family history of PCOS or diabetes
              </label>

              <div className="pcos-field" style={{ marginTop: '1rem' }}>
                <label htmlFor="pcosNotes">Personal Hormonal Notes (Optional)</label>
                <textarea
                  id="pcosNotes"
                  value={pcosProfile.notes}
                  onChange={(e) => setPcosProfile((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Record any medication reactions, pelvic pain, or physician comments..."
                />
              </div>

              <button type="submit" className="pcos-btn-primary" disabled={pcosSaving} style={{ marginTop: '1rem' }}>
                {pcosSaving ? 'Saving &amp; Evaluating…' : 'Save &amp; Re-evaluate PCOS Patterns'}
              </button>
            </form>

            <div className="pcos-disclaimer" style={{ marginTop: '1.5rem' }}>
              {pcosScreening?.disclaimer ||
                'DISCLAIMER: This screening tool evaluates statistical symptom patterns. It is not a clinical ultrasound or biochemical diagnosis. Please consult a licensed Gynecologist or Endocrinologist for full medical evaluation.'}
            </div>
          </div>
        )}
      </div>

      {/* LOG PERIOD MODAL */}
      {showForm && (
        <div className="cycle-overlay" onClick={() => setShowForm(false)}>
          <div className="cycle-form-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Period Record' : 'Log a Period Cycle'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="cycle-field-row">
                <div className="cycle-field">
                  <label htmlFor="periodStartDate">Period Start Date *</label>
                  <input
                    id="periodStartDate"
                    type="date"
                    value={form.periodStartDate}
                    onChange={(e) => handleFormChange('periodStartDate', e.target.value)}
                    required
                  />
                </div>
                <div className="cycle-field">
                  <label htmlFor="periodEndDate">Period End Date (Optional)</label>
                  <input
                    id="periodEndDate"
                    type="date"
                    value={form.periodEndDate}
                    onChange={(e) => handleFormChange('periodEndDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="cycle-field">
                <label htmlFor="flowLevel">Overall Flow Level</label>
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
                <label htmlFor="symptoms">Symptoms (Comma Separated)</label>
                <input
                  id="symptoms"
                  type="text"
                  placeholder="e.g. Cramps, bloating, mood swings, fatigue"
                  value={form.symptoms}
                  onChange={(e) => handleFormChange('symptoms', e.target.value)}
                />
              </div>

              <div className="cycle-field">
                <label htmlFor="notes">Cycle Notes (Optional)</label>
                <textarea
                  id="notes"
                  placeholder="Any symptoms, lifestyle factors, or medication notes..."
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </div>

              <div className="cycle-daily-flow-editor">
                <div className="cycle-daily-flow-editor-header">
                  <label>Daily Flow Logs (Optional)</label>
                  <button type="button" className="cycle-btn-secondary" onClick={addDailyFlowRow}>
                    + Add Day
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
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Log Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}