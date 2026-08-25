import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkSymptoms, getSymptomCheckHistory, clearSymptomCheckHistory } from '../api/healthApi';
import '../styles/SymptomChecker.css';

const SYMPTOM_OPTIONS = [
  { id: 'fever', label: 'Fever / High Temperature', icon: '🌡️' },
  { id: 'headache', label: 'Headache / Migraine', icon: '🤕' },
  { id: 'cough', label: 'Persistent Cough', icon: '🗣️' },
  { id: 'sore throat', label: 'Sore / Scratchy Throat', icon: '🧣' },
  { id: 'shortness of breath', label: 'Shortness of Breath', icon: '🫁' },
  { id: 'fatigue', label: 'Severe Fatigue & Weakness', icon: '🥱' },
  { id: 'chest pain', label: 'Chest Pain or Tightness', icon: '🫀' },
  { id: 'nausea', label: 'Nausea or Vomiting', icon: '🤢' },
  { id: 'dizziness', label: 'Dizziness or Lightheadedness', icon: '💫' },
  { id: 'body aches', label: 'Muscle & Body Aches', icon: '💪' },
  { id: 'loss of taste/smell', label: 'Loss of Taste or Smell', icon: '👃' },
  { id: 'runny nose', label: 'Runny or Stuffy Nose', icon: '🤧' },
  { id: 'abdominal pain', label: 'Abdominal / Stomach Pain', icon: '🩺' },
];

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState('Moderate');
  const [durationDays, setDurationDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const data = await getSymptomCheckHistory();
        if (isMounted) setHistory(data.history || []);
      } catch (err) {
        console.error('Error loading symptom history:', err);
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  function toggleSymptom(label) {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom to analyze.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await checkSymptoms({
        symptoms: selectedSymptoms,
        severity,
        durationDays: Number(durationDays),
      });
      setPredictionResult(data.result);
      setToastMsg('🔮 Symptom check analysis completed!');
      const hist = await getSymptomCheckHistory();
      setHistory(hist.history || []);
    } catch (err) {
      setError(err.message || 'Symptom analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    if (!window.confirm('Clear all symptom check history?')) return;
    try {
      await clearSymptomCheckHistory();
      setHistory([]);
      setPredictionResult(null);
      setSelectedSymptoms([]);
      setToastMsg('🗑️ Symptom history cleared.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="sym-page">
      <div className="sym-shell">
        <div className="sym-header">
          <p className="sym-eyebrow">Clinical Intelligence Engine</p>
          <h1>AI Rule-Based Symptom Checker</h1>
          <p className="sym-subtext">
            Select your current symptoms to evaluate combination patterns, differential diagnoses, and urgency classifications.
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
          {/* Left Column: Symptom Selector Form */}
          <div className="sym-card">
            <h3>1. Select Observed Symptoms</h3>
            <p className="sym-hint">Choose all symptoms currently affecting you:</p>

            <div className="sym-chips-grid">
              {SYMPTOM_OPTIONS.map((item) => {
                const isSelected = selectedSymptoms.includes(item.label) || selectedSymptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sym-chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSymptom(item.label)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAnalyze} style={{ marginTop: '1.5rem' }}>
              <div className="sym-form-row">
                <div className="sym-form-field">
                  <label htmlFor="severity">Severity Level</label>
                  <select
                    id="severity"
                    className="sym-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="Mild">Mild (Noticeable but manageable)</option>
                    <option value="Moderate">Moderate (Interfering with daily tasks)</option>
                    <option value="Severe">Severe (Intense / Incapacitating)</option>
                  </select>
                </div>

                <div className="sym-form-field">
                  <label htmlFor="durationDays">Duration (Days)</label>
                  <input
                    id="durationDays"
                    type="number"
                    min="1"
                    max="60"
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
                {loading ? 'Analyzing Symptom Patterns…' : `🔍 Analyze ${selectedSymptoms.length} Selected Symptom(s)`}
              </button>
            </form>
          </div>

          {/* Right Column: Prediction Results Card */}
          <div className="sym-card sym-result-panel">
            <h3>2. Analysis & Disease Prediction</h3>

            {!predictionResult ? (
              <div className="sym-empty-state">
                <span style={{ fontSize: '3rem' }}>🩺</span>
                <h4>No Analysis Generated Yet</h4>
                <p>Select symptoms from the left panel and click "Analyze Symptoms" to run the algorithmic disease predictor.</p>
              </div>
            ) : (
              <div className="sym-prediction-content">
                <div className="sym-prediction-top">
                  <div>
                    <span className="sym-badge-label">Top Matched Condition</span>
                    <h2 className="sym-disease-title">{predictionResult.prediction?.topPrediction?.disease}</h2>
                    <span className="sym-confidence-pill">
                      Confidence: {predictionResult.prediction?.topPrediction?.confidence}%
                    </span>
                  </div>
                  <span
                    className={`sym-urgency-badge urgency-${(predictionResult.prediction?.topPrediction?.urgency || 'moderate').toLowerCase()}`}
                  >
                    {predictionResult.prediction?.topPrediction?.urgency} Alert
                  </span>
                </div>

                <div className="sym-section-block">
                  <h4>📋 Recommended Clinical Action</h4>
                  <p>{predictionResult.prediction?.topPrediction?.recommendation}</p>
                </div>

                {predictionResult.prediction?.topPrediction?.medicines && (
                  <div className="sym-section-block">
                    <h4>💊 Recommended Remedies & Treatments</h4>
                    <div className="sym-meds-list">
                      {predictionResult.prediction.topPrediction.medicines.map((med, idx) => (
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

                {predictionResult.prediction?.allPredictions && predictionResult.prediction.allPredictions.length > 1 && (
                  <div className="sym-section-block">
                    <h4>🔍 Differential Diagnoses (Other Possible Matches)</h4>
                    <div className="sym-diff-tags">
                      {predictionResult.prediction.allPredictions.slice(1).map((diff, idx) => (
                        <span key={idx} className="sym-diff-chip">
                          {diff.disease} ({diff.confidence}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Log Section */}
        {history.length > 0 && (
          <div className="sym-card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📜 Past Symptom Check Records</h3>
              <button className="sym-btn-secondary" onClick={handleClearHistory}>
                Clear History
              </button>
            </div>

            <div className="sym-history-grid">
              {history.map((item, idx) => (
                <div key={idx} className="sym-history-card">
                  <div className="sym-history-header">
                    <strong>{item.prediction?.topPrediction?.disease || 'Check Record'}</strong>
                    <span className="sym-hist-date">
                      {new Date(item.checkedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="sym-hist-symptoms">
                    <strong>Symptoms:</strong> {item.symptoms?.join(', ')}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <span className={`sym-urgency-chip urgency-${(item.prediction?.topPrediction?.urgency || 'low').toLowerCase()}`}>
                      {item.prediction?.topPrediction?.urgency}
                    </span>
                    <span className="sym-hist-conf">
                      {item.prediction?.topPrediction?.confidence}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sym-disclaimer">
          ⚠️ <strong>Medical Advisory Notice:</strong> This AI-assisted rule-based symptom checker evaluates self-reported symptoms for educational awareness. It is not a clinical diagnostic device. If you experience severe chest pain, shortness of breath, or emergency symptoms, contact emergency medical services immediately.
        </div>
      </div>
    </div>
  );
}
