import { useEffect, useState } from 'react';
import { fetchCyclePrediction } from '../api/menstrualCycleApi';
import '../styles/CyclePrediction.css';

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CyclePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchCyclePrediction();
        if (isMounted) setPrediction(data);
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

  return (
    <div className="predict-page">
      <div className="predict-shell">
        <p className="predict-eyebrow">Menstrual health</p>
        <h1>Cycle &amp; Fertile-Window Prediction</h1>

        {error && <div className="predict-error-banner">{error}</div>}

        {loading ? (
          <p className="predict-muted">Calculating your prediction…</p>
        ) : prediction && !prediction.hasEnoughData ? (
          <div className="predict-empty">
            <p className="predict-empty-title">Not enough data yet</p>
            <p>{prediction.message}</p>
          </div>
        ) : prediction ? (
          <div className="predict-grid">
            <div className="predict-stat">
              <span className="predict-stat-label">Average cycle length</span>
              <span className="predict-stat-value">{prediction.averageCycleLength} days</span>
            </div>
            <div className="predict-stat">
              <span className="predict-stat-label">Last recorded period</span>
              <span className="predict-stat-value">{formatDate(prediction.lastPeriodStart)}</span>
            </div>
            <div className="predict-stat highlight">
              <span className="predict-stat-label">Predicted next period</span>
              <span className="predict-stat-value">{formatDate(prediction.predictedNextPeriod)}</span>
            </div>
            <div className="predict-stat">
              <span className="predict-stat-label">Estimated ovulation date</span>
              <span className="predict-stat-value">{formatDate(prediction.estimatedOvulationDate)}</span>
            </div>
            <div className="predict-stat highlight">
              <span className="predict-stat-label">Estimated fertile window</span>
              <span className="predict-stat-value">
                {formatDate(prediction.fertileWindow.start)} – {formatDate(prediction.fertileWindow.end)}
              </span>
            </div>
          </div>
        ) : null}

        <div className="predict-disclaimer">
          {prediction?.disclaimer ||
            'Cycle and fertile-window predictions are estimates based on recorded cycle history. They should not be used as a guaranteed method of contraception or as medical advice.'}
        </div>
      </div>
    </div>
  );
}