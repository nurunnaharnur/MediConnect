import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchSymptomOptions,
  runSymptomCheck,
  getSymptomCheckHistory,
  clearSymptomCheckHistory,
} from '../api/symptomApi';
import '../styles/SymptomChecker.css';

const DEFAULT_CATEGORIES = [
  { id: 'All', label: '🌐 All Symptoms' },
  { id: 'General', label: '🌡️ General & Fever' },
  { id: 'Cardio / Respiratory', label: '🫀 Cardio & Chest' },
  { id: 'Neurological', label: '🧠 Neurological & Head' },
  { id: 'Digestive', label: '🩺 Stomach & Gut' },
  { id: 'Metabolic', label: '🩸 Metabolic & Glucose' },
  { id: 'Mental Wellbeing', label: '🧘 Mental Wellbeing' },
  { id: 'Reproductive Health', label: '🌸 Reproductive & PCOS' },
  { id: 'Skin', label: '✨ Skin & Allergy' },
  { id: 'Musculoskeletal', label: '🦴 Joints & Bones' },
];

const QUICK_PRESETS = [
  { label: '🌡️ Flu & Cough', symptoms: ['fever', 'cough'] },
  { label: '🫀 Chest Tightness', symptoms: ['chest_pain'] },
  { label: '🤕 Migraine & Vision', symptoms: ['persistent_headache', 'blurred_vision'] },
  { label: '🩸 Diabetes Indicator', symptoms: ['frequent_urination', 'excessive_thirst', 'fatigue'] },
  { label: '🧘 Anxiety & Heart Racing', symptoms: ['excessive_worry', 'restlessness', 'racing_heart'] },
  { label: '🌸 PCOS & Irregular Cycle', symptoms: ['irregular_periods', 'weight_gain', 'acne'] },
  { label: '🩺 Stomach & Nausea', symptoms: ['abdominal_pain', 'nausea'] },
];

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [symptomOptions, setSymptomOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severityLevel, setSeverityLevel] = useState('Moderate');
  const [durationDays, setDurationDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [opts, hist] = await Promise.all([
          fetchSymptomOptions().catch(() => []),
          getSymptomCheckHistory().catch(() => []),
        ]);
        if (isMounted) {
          setSymptomOptions(Array.isArray(opts) ? opts : []);
          setHistory(Array.isArray(hist) ? hist : []);
        }
      } catch (err) {
        console.error('Failed loading initial symptom options:', err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  function toggleSymptom(key) {
    setSelectedSymptoms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSelectPreset(preset) {
    setSelectedSymptoms(preset.symptoms);
    setError('');
  }

  function handleClearSelection() {
    setSelectedSymptoms([]);
    setResult(null);
  }

  function removeSingleSymptom(key) {
    setSelectedSymptoms((prev) => prev.filter((k) => k !== key));
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom from the list or quick presets.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await runSymptomCheck({
        symptoms: selectedSymptoms,
        severity: severityLevel,
        durationDays: Number(durationDays),
      });
      setResult(data);
      setToastMsg('🔮 Clinical rule-based assessment completed!');
      const updatedHistory = await getSymptomCheckHistory().catch(() => []);
      setHistory(Array.isArray(updatedHistory) ? updatedHistory : []);
    } catch (err) {
      setError(err.message || 'Analysis request failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    if (!window.confirm('Are you sure you want to clear your symptom check history?')) return;
    try {
      await clearSymptomCheckHistory();
      setHistory([]);
      setToastMsg('🗑️ Symptom check history cleared.');
    } catch (err) {
      setError(err.message);
    }
  }

  // Filtered options based on category and search query
  const filteredOptions = symptomOptions.filter((opt) => {
    const matchCat = selectedCategory === 'All' || opt.category === selectedCategory;
    const matchQuery =
      searchQuery.trim() === '' ||
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="sym-page">
      <div className="sym-shell">
        {/* Top Header */}
        <div className="sym-header">
          <p className="sym-eyebrow">AI Rule-Based Clinical Engine</p>
          <h1>Advanced Symptom &amp; Disease Checker</h1>
          <p className="sym-subtext">
            Evaluate expanded clinical symptom combinations including Cardiovascular, Metabolic (Diabetes), Mental Wellbeing (Depression, Anxiety, OCD), and Reproductive Health (PCOS) to receive specialist doctor recommendations and urgency ratings.
          </p>
        </div>

        {/* Quick Presets Bar */}
        <div className="sym-presets-bar">
          <span className="sym-presets-label">⚡ Quick Presets:</span>
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="sym-preset-chip"
              onClick={() => handleSelectPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && <div className="sym-banner sym-banner-error">{error}</div>}
        {toastMsg && (
          <div className="sym-banner sym-banner-success">
            {toastMsg}
            <button className="sym-close-btn" onClick={() => setToastMsg('')}>✕</button>
          </div>
        )}

        <div className="sym-layout">
          {/* LEFT COLUMN: SYMPTOM SELECTOR */}
          <div className="sym-card">
            <div className="sym-card-top-bar">
              <div>
                <h3>1. Select Observed Symptoms</h3>
                <p className="sym-hint">
                  Choose all symptoms currently experienced ({selectedSymptoms.length} selected)
                </p>
              </div>
              {selectedSymptoms.length > 0 && (
                <button type="button" className="sym-btn-text-danger" onClick={handleClearSelection}>
                  ✕ Reset Selection
                </button>
              )}
            </div>

            {/* Active Selected Tray */}
            {selectedSymptoms.length > 0 && (
              <div className="sym-selected-tray">
                <div className="sym-tray-header">
                  <span className="sym-tray-title">Active Selection ({selectedSymptoms.length})</span>
                </div>
                <div className="sym-tray-chips">
                  {selectedSymptoms.map((symKey) => {
                    const opt = symptomOptions.find((o) => o.key === symKey);
                    return (
                      <span key={symKey} className="sym-tray-tag">
                        {opt?.icon || '🩺'} {opt?.label || symKey}
                        <button
                          type="button"
                          className="sym-tag-remove"
                          onClick={() => removeSingleSymptom(symKey)}
                          title="Remove symptom"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="sym-search-wrap">
              <input
                type="text"
                className="sym-search-input"
                placeholder="🔍 Search symptoms (e.g. fatigue, headache, chest pain, sadness, periods)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="sym-cat-pills">
              {DEFAULT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`sym-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Checklist Grid */}
            <div className="sym-checklist-grid">
              {filteredOptions.length === 0 ? (
                <div className="sym-empty-filter">
                  <p>No symptoms match “{searchQuery}”.</p>
                  <button
                    type="button"
                    className="sym-preset-chip"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredOptions.map((item) => {
                  const isChecked = selectedSymptoms.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`sym-chip-btn ${isChecked ? 'selected' : ''}`}
                      onClick={() => toggleSymptom(item.key)}
                    >
                      <span className="sym-chip-icon">{item.icon || '🩺'}</span>
                      <div className="sym-chip-body">
                        <span className="sym-chip-title">{item.label}</span>
                        <span className="sym-chip-cat">{item.category}</span>
                      </div>
                      <span className="sym-check-marker">{isChecked ? '✓' : '+'}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Severity and Submit Controls */}
            <form onSubmit={handleAnalyze} className="sym-controls-card">
              <span className="sym-control-label">2. Perceived Severity Level</span>
              <div className="sym-severity-toggles">
                <button
                  type="button"
                  className={`sym-toggle-btn mild ${severityLevel === 'Mild' ? 'selected' : ''}`}
                  onClick={() => setSeverityLevel('Mild')}
                >
                  🟢 Mild (Manageable)
                </button>
                <button
                  type="button"
                  className={`sym-toggle-btn moderate ${severityLevel === 'Moderate' ? 'selected' : ''}`}
                  onClick={() => setSeverityLevel('Moderate')}
                >
                  🟡 Moderate (Disruptive)
                </button>
                <button
                  type="button"
                  className={`sym-toggle-btn severe ${severityLevel === 'Severe' ? 'selected' : ''}`}
                  onClick={() => setSeverityLevel('Severe')}
                >
                  🔴 Severe (Intense)
                </button>
              </div>

              <div className="sym-duration-row">
                <span className="sym-control-label" style={{ margin: 0 }}>
                  Duration (Days):
                </span>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="sym-input-num"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
                <span style={{ fontSize: '0.85rem', color: '#5B6B65' }}>days experienced</span>
              </div>

              <button
                type="submit"
                className="sym-btn-primary"
                disabled={loading || selectedSymptoms.length === 0}
              >
                {loading
                  ? 'Analyzing Clinical Pattern…'
                  : selectedSymptoms.length === 0
                  ? 'Select Symptoms Above to Begin'
                  : `🔍 Run Clinical Analysis (${selectedSymptoms.length} Selected)`}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: PREDICTION & SPECIALIST RECOMMENDATION */}
          <div className="sym-card sym-result-panel">
            <div className="sym-card-top-bar">
              <div>
                <h3>2. Clinical Assessment &amp; Specialist Guidance</h3>
                <p className="sym-hint">Deterministic evaluation based on clinical guidelines</p>
              </div>
            </div>

            {!result ? (
              <div className="sym-empty-guide">
                <span className="sym-empty-icon">🩺</span>
                <h4>No Symptoms Evaluated Yet</h4>
                <p>
                  Select your symptoms from the left panel or choose a <strong>Quick Preset</strong>, then click <strong>Run Clinical Analysis</strong>.
                </p>

                <div className="sym-guide-grid">
                  <div className="sym-guide-item">
                    <span>🫀</span>
                    <h6>Cardio &amp; Respiration</h6>
                    <p>Chest pain, dyspnea, edema assessment</p>
                  </div>
                  <div className="sym-guide-item">
                    <span>🩸</span>
                    <h6>Metabolic Checks</h6>
                    <p>Polydipsia, polyuria, diabetes indicators</p>
                  </div>
                  <div className="sym-guide-item">
                    <span>🧘</span>
                    <h6>Mental Wellbeing</h6>
                    <p>Depression, anxiety, OCD screenings</p>
                  </div>
                  <div className="sym-guide-item">
                    <span>🌸</span>
                    <h6>Reproductive Health</h6>
                    <p>PCOS, cycle irregularity, hormonal signs</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sym-prediction-content">
                {/* Result Header */}
                <div className="sym-prediction-top">
                  <div>
                    <span className="sym-badge-label">Clinical Impression</span>
                    <h2 className="sym-disease-title">{result.condition}</h2>
                  </div>
                  <span className={`sym-urgency-badge urgency-${(result.severity || 'low').toLowerCase()}`}>
                    {result.severity} Urgency
                  </span>
                </div>

                {/* Specialist Recommendation Card */}
                <div className="sym-specialist-banner">
                  <div className="sym-spec-info">
                    <span className="sym-spec-icon">👨‍⚕️</span>
                    <div>
                      <span className="sym-spec-label">Recommended Medical Specialist</span>
                      <h4 className="sym-spec-name">{result.specialist}</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sym-btn-book"
                    onClick={() => navigate('/appointments')}
                  >
                    📅 Book Consultation
                  </button>
                </div>

                {/* Sensitive / Mental Health Notice */}
                {result.sensitive && (
                  <div className="sym-sensitive-banner">
                    <strong>💜 Mental &amp; Reproductive Health Advisory</strong>
                    <p>{result.disclaimer}</p>
                    <div className="sym-sensitive-actions">
                      <button
                        type="button"
                        className="sym-btn-sm"
                        onClick={() => navigate('/mental-wellbeing')}
                      >
                        🧠 Open Mental Wellbeing Hub
                      </button>
                      <button
                        type="button"
                        className="sym-btn-sm"
                        onClick={() => navigate('/cycles')}
                      >
                        🌸 Open Menstruation &amp; PCOS Tracker
                      </button>
                    </div>
                  </div>
                )}

                {/* Recommendation / Action Guideline */}
                {result.recommendation && (
                  <div className="sym-section-block">
                    <h4>📋 Recommended Clinical Guidance</h4>
                    <p>{result.recommendation}</p>
                  </div>
                )}

                {/* Remedies & Prescriptions */}
                {result.remedies && result.remedies.length > 0 && (
                  <div className="sym-section-block">
                    <h4>💊 Suggested Care &amp; Medication Reminders</h4>
                    <div className="sym-meds-list">
                      {result.remedies.map((med, idx) => (
                        <div key={idx} className="sym-med-item">
                          <div>
                            <strong>💊 {med.name}</strong>
                            <p>{med.dosage}</p>
                          </div>
                          <button
                            type="button"
                            className="sym-quick-btn"
                            onClick={() => navigate('/reminders')}
                            title="Schedule reminder in Medicine Reminders"
                          >
                            + Schedule Dose
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Differential Diagnoses */}
                {result.differentialDiagnoses && result.differentialDiagnoses.length > 0 && (
                  <div className="sym-section-block">
                    <h4>🔍 Differential Overlap Matches</h4>
                    <div className="sym-diff-tags">
                      {result.differentialDiagnoses.map((diff, idx) => (
                        <span key={idx} className="sym-diff-chip">
                          <strong>{diff.condition}</strong> ({diff.confidence}% overlap) • <small>{diff.specialist}</small>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Disclaimer */}
                {!result.sensitive && result.disclaimer && (
                  <p className="sym-footer-disclaimer">
                    ℹ️ {result.disclaimer}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PAST SYMPTOM CHECK RECORDS */}
        {history.length > 0 && (
          <div className="sym-card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>📜 Past Symptom Check Records ({history.length})</h3>
              <button type="button" className="sym-btn-text-danger" onClick={handleClearHistory}>
                Clear All Logs
              </button>
            </div>

            <div className="sym-history-grid">
              {history.map((item, idx) => (
                <div key={item._id || idx} className="sym-history-card">
                  <div className="sym-history-header">
                    <strong>{item.condition}</strong>
                    <span className="sym-hist-date">
                      {item.createdAt || item.checkedAt
                        ? new Date(item.createdAt || item.checkedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent'}
                    </span>
                  </div>
                  <p className="sym-hist-symptoms">
                    <strong>Symptoms:</strong> {Array.isArray(item.symptoms) ? item.symptoms.join(', ') : ''}
                  </p>
                  <div className="sym-hist-footer">
                    <span className={`sym-urgency-chip urgency-${(item.severity || 'low').toLowerCase()}`}>
                      {item.severity}
                    </span>
                    <span className="sym-hist-spec">👨‍⚕️ {item.specialist}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sym-disclaimer">
          ⚠️ <strong>Medical Advisory Disclaimer:</strong> MediConnect Symptom Checker uses deterministic, evidence-based clinical rules to assist patient self-awareness. It is not an automated medical diagnostic tool. In life-threatening emergencies, call emergency services (911/999) or visit the nearest hospital emergency room immediately.
        </div>
      </div>
    </div>
  );
}
