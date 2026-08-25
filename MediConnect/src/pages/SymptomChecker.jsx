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
  'All',
  'General',
  'Cardio / Respiratory',
  'Neurological',
  'Digestive',
  'Metabolic',
  'Mental Wellbeing',
  'Reproductive Health',
  'Skin',
  'Musculoskeletal',
];

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [symptomOptions, setSymptomOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severityLevel, setSeverityLevel] = useState('Moderate');
  const [durationDays, setDurationDays] = useState(1);
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

  function handleClearSelection() {
    setSelectedSymptoms([]);
    setResult(null);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom to evaluate.');
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
      setToastMsg('🔮 Symptom check & clinical analysis completed!');
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
        <div className="sym-header">
          <p className="sym-eyebrow">AI Rule-Based Clinical Engine</p>
          <h1>Advanced Symptom & Disease Checker</h1>
          <p className="sym-subtext">
            Evaluate expanded clinical combinations including Metabolic (Diabetes), Mental Wellbeing (Depression, Anxiety, OCD), Reproductive Health (PCOS), and receive specialist recommendations and urgency ratings.
          </p>
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
                  {selectedSymptoms.length} symptom(s) currently selected
                </p>
              </div>
              {selectedSymptoms.length > 0 && (
                <button type="button" className="sym-btn-text-danger" onClick={handleClearSelection}>
                  Reset Selection
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="sym-search-wrap">
              <input
                type="text"
                className="sym-search-input"
                placeholder="Search symptoms (e.g. fatigue, sadness, chest pain, periods)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="sym-cat-pills">
              {DEFAULT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`sym-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Checklist Grid */}
            <div className="sym-checklist-grid">
              {filteredOptions.length === 0 ? (
                <div className="sym-empty-filter">No symptoms match your search.</div>
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
            <form onSubmit={handleAnalyze} style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E7ECEA' }}>
              <div className="sym-form-row">
                <div className="sym-form-field">
                  <label htmlFor="severityLevel">Perceived Severity</label>
                  <select
                    id="severityLevel"
                    className="sym-select"
                    value={severityLevel}
                    onChange={(e) => setSeverityLevel(e.target.value)}
                  >
                    <option value="Mild">Mild (Noticeable but manageable)</option>
                    <option value="Moderate">Moderate (Interfering with daily routine)</option>
                    <option value="Severe">Severe (Intense / High impact)</option>
                  </select>
                </div>

                <div className="sym-form-field">
                  <label htmlFor="duration">Duration (Days)</label>
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    max="90"
                    className="sym-input"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="sym-btn-primary"
                disabled={loading || selectedSymptoms.length === 0}
                style={{ width: '100%', marginTop: '1.25rem' }}
              >
                {loading ? 'Evaluating Symptom Pattern…' : `🔍 Analyze ${selectedSymptoms.length} Selected Symptom(s)`}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: PREDICTION & SPECIALIST RECOMMENDATION */}
          <div className="sym-card sym-result-panel">
            <h3>2. Analysis & Specialist Recommendation</h3>

            {!result ? (
              <div className="sym-empty-state">
                <span style={{ fontSize: '3.2rem' }}>🩺</span>
                <h4>No Analysis Generated Yet</h4>
                <p>
                  Select your symptoms from the checklist on the left and click <strong>Analyze Selected Symptoms</strong> to run the rule-based prediction engine.
                </p>
              </div>
            ) : (
              <div className="sym-prediction-content">
                {/* Result Header */}
                <div className="sym-prediction-top">
                  <div>
                    <span className="sym-badge-label">Predicted Condition / Indicator</span>
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
                      <span className="sym-spec-label">Recommended Specialist</span>
                      <h4 className="sym-spec-name">{result.specialist}</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sym-btn-book"
                    onClick={() => navigate('/appointments')}
                  >
                    📅 Book Appointment
                  </button>
                </div>

                {/* Sensitive / Mental Health Notice */}
                {result.sensitive && (
                  <div className="sym-sensitive-banner">
                    <strong>💜 Mental & Reproductive Health Advisory</strong>
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
                        onClick={() => navigate('/pcos')}
                      >
                        🌸 Open PCOS Tracker
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
                    <h4>💊 Recommended Treatment & Remedies</h4>
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
                            📅 Schedule Dose
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Differential Diagnoses */}
                {result.differentialDiagnoses && result.differentialDiagnoses.length > 0 && (
                  <div className="sym-section-block">
                    <h4>🔍 Differential Matches</h4>
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
              <button type="button" className="sym-btn-secondary" onClick={handleClearHistory}>
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
          ⚠️ <strong>Medical Advisory Disclaimer:</strong> MediConnect Symptom Checker uses deterministic, evidence-based clinical rules to assist patient self-awareness. It is not an automated medical diagnostic tool. In life-threatening situations, dial 911 or visit the nearest emergency care facility immediately.
        </div>
      </div>
    </div>
  );
}
