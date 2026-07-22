import { useEffect, useState } from 'react';
import {
  fetchSymptomOptions,
  submitSymptomCheck,
  fetchSymptomHistory,
} from '../api/symptomApi';
import '../styles/SymptomChecker.css';

const SEVERITY_CLASS = {
  Low: 'severity-low',
  Moderate: 'severity-moderate',
  Urgent: 'severity-urgent',
};

export default function SymptomChecker() {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [opts, hist] = await Promise.all([
          fetchSymptomOptions(),
          fetchSymptomHistory(),
        ]);
        setOptions(opts);
        setHistory(hist);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleSymptom(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selected.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }
    setError('');
    setChecking(true);
    setResult(null);
    try {
      const data = await submitSymptomCheck(selected);
      setResult(data);
      setHistory((prev) => [data, ...prev]);
      setSelected([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  const grouped = options.reduce((acc, opt) => {
    (acc[opt.category] ||= []).push(opt);
    return acc;
  }, {});

  if (loading) return <div className="symptom-checker">Loading...</div>;

  return (
    <div className="symptom-checker">
      <h1>Symptom Checker</h1>
      <p className="sc-subtitle">
        Select what you're experiencing. This tool gives informational guidance only —
        it is not a medical diagnosis.
      </p>

      {error && <div className="sc-error">{error}</div>}

      <form onSubmit={handleSubmit} className="sc-form">
        {Object.entries(grouped).map(([category, symptoms]) => (
          <fieldset key={category} className="sc-group">
            <legend>{category}</legend>
            <div className="sc-checklist">
              {symptoms.map((opt) => (
                <label key={opt.key} className="sc-checkbox">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.key)}
                    onChange={() => toggleSymptom(opt.key)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <button type="submit" disabled={checking} className="sc-submit">
          {checking ? 'Checking...' : 'Check Symptoms'}
        </button>
      </form>

      {result && (
        <div className={`sc-result ${SEVERITY_CLASS[result.severity]}`}>
          <h2>{result.condition}</h2>
          <p><strong>Recommended specialist:</strong> {result.specialist}</p>
          <p><strong>Severity:</strong> {result.severity}</p>
          <p className="sc-disclaimer">{result.disclaimer}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="sc-history">
          <h2>Past Checks</h2>
          <ul>
            {history.map((h) => (
              <li key={h._id}>
                <span className={`sc-badge ${SEVERITY_CLASS[h.severity]}`}>{h.severity}</span>
                {h.condition} — {h.specialist}
                <span className="sc-date">
                  {new Date(h.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
