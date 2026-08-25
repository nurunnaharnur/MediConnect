import { useState, useEffect } from 'react';
import { fetchVitals, logVital, clearVitals } from '../api/healthApi';
import '../styles/BloodPressure.css';

export default function BloodPressure() {
  const [vitals, setVitals] = useState([]);
  const [form, setForm] = useState({
    systolic: '',
    diastolic: '',
    pulse: '72',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchVitals();
        if (isMounted) setVitals(data.vitals || []);
      } catch (err) {
        console.error('Error loading BP vitals:', err);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.systolic || !form.diastolic) return;
    setSaving(true);
    try {
      const data = await logVital(form);
      setFeedback(`📈 Recorded BP: ${data.vital.systolic}/${data.vital.diastolic} mmHg (${data.vital.status})`);
      setForm({ systolic: '', diastolic: '', pulse: '72' });
      const res = await fetchVitals();
      setVitals(res.vitals || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear all recorded blood pressure logs?')) return;
    try {
      await clearVitals();
      setVitals([]);
      setFeedback('🗑️ Blood pressure logs cleared.');
    } catch (err) {
      alert(err.message);
    }
  }

  function getStatusClass(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('crisis')) return 'crisis';
    if (s.includes('stage 2')) return 'stage2';
    if (s.includes('stage 1')) return 'stage1';
    if (s.includes('elevated')) return 'elevated';
    return 'normal';
  }

  const hasCrisis = vitals.some((v) => v.alert);
  const latestVital = vitals[0];

  // SVG Chart Calculation
  const chartReadings = [...vitals].reverse().slice(-12);
  const hasEnoughData = chartReadings.length >= 2;

  let svgContent = null;
  if (hasEnoughData) {
    const W = 700;
    const H = 260;
    const PAD = { top: 20, right: 25, bottom: 40, left: 45 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    const allVals = chartReadings.flatMap((r) => [r.systolic, r.diastolic]);
    const minVal = Math.max(40, Math.min(...allVals) - 15);
    const maxVal = Math.min(220, Math.max(...allVals) + 15);

    const xStep = cW / (chartReadings.length - 1);
    const yScale = (val) => PAD.top + cH - ((val - minVal) / (maxVal - minVal)) * cH;
    const xPos = (i) => PAD.left + i * xStep;

    const gridSteps = [60, 80, 100, 120, 140, 160, 180].filter((v) => v >= minVal && v <= maxVal);

    let sysPoints = '';
    let diaPoints = '';
    const sysDots = [];
    const diaDots = [];
    const xLabels = [];

    chartReadings.forEach((r, i) => {
      const x = xPos(i);
      const ySys = yScale(r.systolic);
      const yDia = yScale(r.diastolic);

      sysPoints += (i === 0 ? 'M' : 'L') + `${x},${ySys} `;
      diaPoints += (i === 0 ? 'M' : 'L') + `${x},${yDia} `;

      sysDots.push({ x, y: ySys, val: r.systolic, key: `sys-${i}` });
      diaDots.push({ x, y: yDia, val: r.diastolic, key: `dia-${i}` });

      const timeStr = new Date(r.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      xLabels.push({ x, label: timeStr, key: `lbl-${i}` });
    });

    svgContent = (
      <svg className="bp-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* Horizontal Grid lines */}
        {gridSteps.map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#E5E7EB" strokeDasharray="3 3" />
            <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">
              {v}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#D1D5DB" strokeWidth="1.5" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#D1D5DB" strokeWidth="1.5" />

        {/* Systolic Line & Dots */}
        <path d={sysPoints} fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
        {sysDots.map((d) => (
          <circle key={d.key} cx={d.x} cy={d.y} r="5" fill="#DC2626">
            <title>{d.val} mmHg (Systolic)</title>
          </circle>
        ))}

        {/* Diastolic Line & Dots */}
        <path d={diaPoints} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
        {diaDots.map((d) => (
          <circle key={d.key} cx={d.x} cy={d.y} r="5" fill="#2563EB">
            <title>{d.val} mmHg (Diastolic)</title>
          </circle>
        ))}

        {/* X Axis Labels */}
        {xLabels.map((lbl) => (
          <text key={lbl.key} x={lbl.x} y={H - 12} textAnchor="middle" fontSize="10" fill="#6B7280">
            {lbl.label}
          </text>
        ))}
      </svg>
    );
  }

  return (
    <div className="bp-page">
      <div className="bp-shell">
        <div className="bp-header">
          <p className="bp-eyebrow">Cardiovascular Health Monitoring</p>
          <h1>Blood Pressure Vitals & Trends</h1>
          <p className="bp-subtext">
            Log systolic/diastolic readings, track hemodynamic trend charts, and screen for hypertensive risks.
          </p>
        </div>

        {hasCrisis && (
          <div className="bp-crisis-banner">
            <div>
              <strong>🚨 URGENT: Hypertensive Crisis Reading Logged!</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                One or more recorded readings exceeded 180/120 mmHg. Rest for 5 minutes and re-test. If readings remain high or if you experience chest pain, shortness of breath, or numbness, seek emergency medical care immediately.
              </p>
            </div>
          </div>
        )}

        {feedback && (
          <div className="bp-banner-success">
            {feedback}
            <button className="bp-close-btn" onClick={() => setFeedback('')}>✕</button>
          </div>
        )}

        <div className="bp-layout">
          {/* Form Card */}
          <div className="bp-card">
            <h3>Log Blood Pressure Reading</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
              <div className="bp-form-row">
                <div className="bp-field">
                  <label htmlFor="systolic">Systolic (Top / mmHg)</label>
                  <input
                    id="systolic"
                    type="number"
                    min="50"
                    max="260"
                    className="bp-input"
                    placeholder="e.g. 120"
                    value={form.systolic}
                    onChange={(e) => setForm({ ...form, systolic: e.target.value })}
                    required
                  />
                  <span className="bp-field-hint">Normal: &lt;120 mmHg</span>
                </div>

                <div className="bp-field">
                  <label htmlFor="diastolic">Diastolic (Bottom / mmHg)</label>
                  <input
                    id="diastolic"
                    type="number"
                    min="30"
                    max="160"
                    className="bp-input"
                    placeholder="e.g. 80"
                    value={form.diastolic}
                    onChange={(e) => setForm({ ...form, diastolic: e.target.value })}
                    required
                  />
                  <span className="bp-field-hint">Normal: &lt;80 mmHg</span>
                </div>

                <div className="bp-field">
                  <label htmlFor="pulse">Pulse / HR (BPM)</label>
                  <input
                    id="pulse"
                    type="number"
                    min="40"
                    max="200"
                    className="bp-input"
                    placeholder="e.g. 72"
                    value={form.pulse}
                    onChange={(e) => setForm({ ...form, pulse: e.target.value })}
                  />
                  <span className="bp-field-hint">Resting rate</span>
                </div>
              </div>

              <button type="submit" className="bp-btn-primary" disabled={saving} style={{ marginTop: '1.25rem' }}>
                {saving ? 'Recording Vitals…' : '📈 Save Blood Pressure Log'}
              </button>
            </form>

            {/* AHA BP Reference Guide */}
            <div className="bp-guide-box">
              <h4>AHA Blood Pressure Categories:</h4>
              <div className="bp-guide-grid">
                <div className="bp-guide-row normal">
                  <span>Normal:</span>
                  <span>&lt; 120 / &lt; 80 mmHg</span>
                </div>
                <div className="bp-guide-row elevated">
                  <span>Elevated:</span>
                  <span>120–129 / &lt; 80 mmHg</span>
                </div>
                <div className="bp-guide-row stage1">
                  <span>Hypertension Stage 1:</span>
                  <span>130–139 / 80–89 mmHg</span>
                </div>
                <div className="bp-guide-row stage2">
                  <span>Hypertension Stage 2:</span>
                  <span>≥ 140 / ≥ 90 mmHg</span>
                </div>
                <div className="bp-guide-row crisis">
                  <span>Hypertensive Crisis:</span>
                  <span>&gt; 180 / &gt; 120 mmHg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Trend Chart & Latest Status */}
          <div className="bp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>📊 Dynamic BP Trend Chart</h3>
              {latestVital && (
                <span className={`bp-badge ${getStatusClass(latestVital.status)}`}>
                  Latest: {latestVital.status}
                </span>
              )}
            </div>

            {hasEnoughData ? (
              <div>
                <div className="bp-chart-box">{svgContent}</div>
                <div className="bp-legend-wrap">
                  <span className="bp-legend-item"><span className="bp-dot sys" /> Systolic (mmHg)</span>
                  <span className="bp-legend-item"><span className="bp-dot dia" /> Diastolic (mmHg)</span>
                </div>
              </div>
            ) : (
              <div className="bp-chart-empty">
                <span>📈</span>
                <p>Record at least 2 blood pressure entries to view dynamic SVG trend trajectory lines.</p>
              </div>
            )}
          </div>
        </div>

        {/* History Records List */}
        {vitals.length > 0 && (
          <div className="bp-card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📜 Recorded Blood Pressure History ({vitals.length})</h3>
              <button className="bp-btn-text" onClick={handleClear}>Clear All History</button>
            </div>

            <div className="bp-history-grid">
              {vitals.map((v) => (
                <div key={v.id || v._id} className={`bp-history-item ${v.alert ? 'has-crisis' : ''}`}>
                  <div>
                    <div className="bp-hist-reading">
                      {v.systolic}/{v.diastolic} <small>mmHg</small>
                    </div>
                    <div className="bp-hist-meta">
                      <span>❤️ {v.pulse} bpm</span> •{' '}
                      <span>{new Date(v.loggedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <span className={`bp-badge ${getStatusClass(v.status)}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bp-disclaimer">
          ⚠️ <strong>Clinical Notice:</strong> Blood pressure readings should be taken while seated and relaxed. Home readings provide self-management trends and should be evaluated by a healthcare professional for diagnosis or adjustment of antihypertensive medications.
        </div>
      </div>
    </div>
  );
}
