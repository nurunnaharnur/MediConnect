import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCycleData,
  updateCycleSettings,
  logDailyCycleSymptom,
} from '../api/cycleApi';
import { fetchPcosProfile, savePcosProfile, fetchPcosScreening } from '../api/pcosApi';
import '../styles/CycleTracker.css';

// FLO PHYSICAL SYMPTOMS
const FLO_SYMPTOMS = [
  { id: 'Bloating', label: '🐡 Bloated', category: 'physical' },
  { id: 'Headache', label: '🤕 Headache', category: 'physical' },
  { id: 'Cramps', label: '⚡ Cramps', category: 'physical' },
  { id: 'Fatigue', label: '😴 Fatigue', category: 'physical' },
  { id: 'Tender Breasts', label: '👙 Tender Breasts', category: 'physical' },
  { id: 'Acne', label: '✨ Acne / Breakout', category: 'physical' },
  { id: 'Backache', label: '🪵 Lower Backache', category: 'physical' },
  { id: 'Nausea', label: '🤢 Nausea', category: 'physical' },
  { id: 'Cravings', label: '🍫 Cravings', category: 'physical' },
  { id: 'Insomnia', label: '🌙 Insomnia', category: 'physical' },
  { id: 'Pelvic Pain', label: '🩺 Pelvic Pain', category: 'physical' },
  { id: 'Hot Flashes', label: '🔥 Hot Flashes', category: 'physical' },
];

// FLO MOOD OPTIONS
const FLO_MOODS = [
  { id: 'Happy', label: '😄 Happy' },
  { id: 'Calm', label: '😌 Calm' },
  { id: 'Energetic', label: '⚡ Energetic' },
  { id: 'Sensitive', label: '🥺 Sensitive' },
  { id: 'Irritable', label: '😤 Irritable' },
  { id: 'Anxious', label: '😰 Anxious' },
  { id: 'Sad', label: '😢 Sad' },
  { id: 'Mood Swings', label: '🎭 Mood Swings' },
  { id: 'Brain Fog', label: '🌫️ Brain Fog' },
];

// FLO FLOW OPTIONS
const FLO_FLOWS = [
  { id: 'none', label: '⚪ No Flow' },
  { id: 'spotting', label: '🩸 Spotting' },
  { id: 'light', label: '💧 Light' },
  { id: 'medium', label: '🌊 Medium' },
  { id: 'heavy', label: '🔴 Heavy' },
];

const EMPTY_PCOS_PROFILE = {
  acne: false,
  excessHairGrowth: false,
  hairThinning: false,
  weightGain: false,
  skinDarkening: false,
  familyHistoryPCOS: false,
  notes: '',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toInputDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function CycleTracker() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'timeline', 'pcos', 'history'

  // Cycle Metrics State
  const [cycleData, setCycleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Daily Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedFlow, setSelectedFlow] = useState('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [logNote, setLogNote] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    lastPeriodStart: '',
    cycleLength: 28,
    periodDuration: 5,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // PCOS States
  const [pcosProfile, setPcosProfile] = useState(EMPTY_PCOS_PROFILE);
  const [pcosScreening, setPcosScreening] = useState(null);
  const [pcosSaving, setPcosSaving] = useState(false);
  const [pcosSuccess, setPcosSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [cData, pProfile, pScreen] = await Promise.all([
          fetchCycleData().catch(() => null),
          fetchPcosProfile().catch(() => EMPTY_PCOS_PROFILE),
          fetchPcosScreening().catch(() => null),
        ]);

        if (isMounted) {
          if (cData) {
            setCycleData(cData);
            setSettingsForm({
              lastPeriodStart: toInputDate(cData.lastPeriodStart),
              cycleLength: cData.cycleLength || 28,
              periodDuration: cData.periodDuration || 5,
            });
          }
          setPcosProfile({ ...EMPTY_PCOS_PROFILE, ...pProfile });
          setPcosScreening(pScreen);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle Symptom Selection
  function toggleSymptom(id) {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  // Toggle Mood Selection
  function toggleMood(id) {
    setSelectedMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  // Handle Save Daily Log
  async function handleSaveDailyLog(e) {
    e.preventDefault();
    setSavingLog(true);
    setError('');
    try {
      // Combine moods & symptoms into symptoms array for the backend schema
      const allSymptoms = [...selectedSymptoms, ...selectedMoods.map((m) => `Mood: ${m}`)];
      const updated = await logDailyCycleSymptom({
        date: logDate,
        flow: selectedFlow,
        symptoms: allSymptoms,
        note: logNote,
      });
      setCycleData(updated);
      setShowLogModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save daily log.');
    } finally {
      setSavingLog(false);
    }
  }

  // Handle Save Cycle Settings
  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    try {
      const updated = await updateCycleSettings(settingsForm);
      setCycleData(updated);
      setShowSettingsModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update cycle settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  // Handle Save PCOS Profile
  async function handleSavePcos(e) {
    e.preventDefault();
    setPcosSaving(true);
    setPcosSuccess('');
    setError('');
    try {
      await savePcosProfile(pcosProfile);
      const screening = await fetchPcosScreening();
      setPcosScreening(screening);
      setPcosSuccess('Your hormonal profile and PCOS screening evaluation have been updated.');
    } catch (err) {
      setError(err.message || 'Failed to save PCOS profile.');
    } finally {
      setPcosSaving(false);
    }
  }

  // Open Log Modal with existing log for selected date
  function openLogForDate(dateStr) {
    const target = dateStr || new Date().toISOString().slice(0, 10);
    setLogDate(target);

    const existingLog = cycleData?.dailyLogs?.find((l) => {
      const d = new Date(l.date).toISOString().slice(0, 10);
      return d === target;
    });

    if (existingLog) {
      setSelectedFlow(existingLog.flow || 'none');
      const physicals = (existingLog.symptoms || []).filter((s) => !s.startsWith('Mood: '));
      const moods = (existingLog.symptoms || [])
        .filter((s) => s.startsWith('Mood: '))
        .map((s) => s.replace('Mood: ', ''));
      setSelectedSymptoms(physicals);
      setSelectedMoods(moods);
      setLogNote(existingLog.note || '');
    } else {
      setSelectedFlow('none');
      setSelectedSymptoms([]);
      setSelectedMoods([]);
      setLogNote('');
    }

    setShowLogModal(true);
  }

  // Compute Flo Headline & Fertility Status
  const currentDay = cycleData?.currentCycleDay || 1;
  const cycleLen = cycleData?.cycleLength || 28;
  const ovulationDay = cycleData?.ovulationDay || Math.max(10, cycleLen - 14);
  const fertileStart = Math.max(6, ovulationDay - 5);
  const fertileEnd = ovulationDay + 1;

  let floStatusHeadline = 'Follicular Phase • Estrogen Rising';
  let floStatusSub = 'Your energy is naturally climbing. Great time for high-focus tasks & workouts.';
  let fertilityProbability = 'Low chance of getting pregnant';
  let phaseClass = 'follicular';

  if (currentDay <= (cycleData?.periodDuration || 5)) {
    phaseClass = 'menstrual';
    floStatusHeadline = `Period Day ${currentDay} • Menstrual Phase`;
    floStatusSub = 'Uterine shedding in progress. Prioritize warm fluids, rest, and iron-rich foods.';
    fertilityProbability = 'Very low chance of conception';
  } else if (currentDay >= fertileStart && currentDay <= fertileEnd) {
    phaseClass = 'ovulation';
    if (currentDay === ovulationDay) {
      floStatusHeadline = '🌟 Peak Ovulation Day!';
      floStatusSub = 'Egg is released. Peak fertile window for conception.';
      fertilityProbability = '🔥 Highest chance of getting pregnant';
    } else {
      const daysToOvu = ovulationDay - currentDay;
      floStatusHeadline = daysToOvu > 0
        ? `🥚 Fertile Window • Ovulation in ${daysToOvu} day(s)`
        : '🥚 Fertile Window • Post-Ovulation';
      floStatusSub = 'High estrogen & LH surge. Increased cervical fluid & energy.';
      fertilityProbability = '✨ High chance of getting pregnant';
    }
  } else if (currentDay > fertileEnd) {
    phaseClass = 'luteal';
    floStatusHeadline = `Luteal Phase • ${cycleData?.daysUntilNext || 10} days until next period`;
    floStatusSub = 'Progesterone peak. Stay mindful of bloating, cravings, or PMS mood shifts.';
    fertilityProbability = 'Low chance of getting pregnant';
  }

  // Count active PCOS flags
  const activePcosCount = [
    pcosProfile.acne,
    pcosProfile.excessHairGrowth,
    pcosProfile.hairThinning,
    pcosProfile.weightGain,
    pcosProfile.skinDarkening,
    pcosProfile.familyHistoryPCOS,
  ].filter(Boolean).length;

  if (loading && !cycleData) {
    return (
      <div className="cycle-page">
        <div className="cycle-shell" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p style={{ color: '#5B6B65', fontSize: '1.1rem' }}>Loading Flo Cycle &amp; Hormonal Intelligence…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cycle-page">
      <div className="cycle-shell">
        {/* Top Header */}
        <div className="cycle-header">
          <div>
            <p className="cycle-eyebrow">Reproductive &amp; Hormonal Intelligence</p>
            <h1>Menstruation &amp; Cycle Tracker</h1>
            <p className="cycle-header-subtitle">
              Flo Health-style cycle predictions, daily symptom &amp; mood logging, fertile window insights, and PCOS pattern screening.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="flo-btn-log"
              onClick={() => openLogForDate()}
            >
              + Log Today's Symptoms
            </button>
          </div>
        </div>

        {error && <div className="cycle-error-banner">{error}</div>}

        {/* Navigation Tabs */}
        <nav className="flo-nav-tabs">
          <button
            type="button"
            className={`flo-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            🌸 Cycle Overview
          </button>
          <button
            type="button"
            className={`flo-nav-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            🗓️ 4-Phase Ovulation Timeline
          </button>
          <button
            type="button"
            className={`flo-nav-tab ${activeTab === 'pcos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pcos')}
          >
            🔬 PCOS Pattern Screener {activePcosCount > 0 ? `(${activePcosCount})` : ''}
          </button>
          <button
            type="button"
            className={`flo-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 Log History ({cycleData?.dailyLogs?.length || 0})
          </button>
        </nav>

        {/* ========================================================
            TAB 1: FLO CYCLE OVERVIEW HERO
            ======================================================== */}
        {activeTab === 'overview' && (
          <>
            {/* Flo Hero Circular Ring Card */}
            <div className="flo-hero-card">
              <div className="flo-hero-left">
                <span className={`flo-phase-pill ${phaseClass}`}>
                  {cycleData?.phaseEmoji || '🌸'} {cycleData?.phase || 'Cycle Overview'}
                </span>

                <h2 className="flo-hero-headline">{floStatusHeadline}</h2>
                <p className="flo-hero-sub">{floStatusSub}</p>

                <div className="flo-fertility-tag">
                  <span>{fertilityProbability}</span>
                </div>

                <div className="flo-quick-bar">
                  <button
                    type="button"
                    className="flo-btn-log"
                    onClick={() => openLogForDate()}
                  >
                    📝 Log Bloating, Headache, Mood
                  </button>
                  <button
                    type="button"
                    className="flo-btn-settings"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    ⚙️ Edit Period Dates
                  </button>
                </div>
              </div>

              {/* Flo Circular Ring Dial */}
              <div className={`flo-ring-dial ${phaseClass}`}>
                <span className="flo-dial-day">{currentDay}</span>
                <span className="flo-dial-total">OF {cycleLen} DAYS</span>
                <span className="flo-dial-label">CURRENT DAY</span>
              </div>
            </div>

            {/* Flo 4-Phase Interactive Timeline Strip */}
            <div className="flo-timeline-card">
              <div className="flo-timeline-header">
                <h3>Cycle Progress &amp; Fertile Window</h3>
                <span style={{ fontSize: '0.85rem', color: '#5B6B65' }}>
                  Next Period Expected: <strong>{formatDate(cycleData?.nextPeriodDate)}</strong>
                </span>
              </div>

              <div className="flo-timeline-bar">
                <div className="flo-bar-seg menstrual" title="Menstrual Phase (Days 1–5)" />
                <div className="flo-bar-seg follicular" title="Follicular Phase (Days 6–11)" />
                <div className="flo-bar-seg ovulation" title="Ovulation & Fertile Window (Days 12–16)" />
                <div className="flo-bar-seg luteal" title="Luteal Phase (Days 17–28)" />
              </div>

              <div className="flo-phases-grid">
                <div className={`flo-phase-box ${phaseClass === 'menstrual' ? 'current' : ''}`}>
                  <h5 className="flo-phase-box-title" style={{ color: '#BE123C' }}>🩸 Menstrual Phase</h5>
                  <p className="flo-phase-box-days">Days 1 – {cycleData?.periodDuration || 5}</p>
                  <p className="flo-phase-box-desc">Uterine lining shedding. Rest &amp; restorative care.</p>
                </div>

                <div className={`flo-phase-box ${phaseClass === 'follicular' ? 'current' : ''}`}>
                  <h5 className="flo-phase-box-title" style={{ color: '#0F766E' }}>🌿 Follicular Phase</h5>
                  <p className="flo-phase-box-days">Days {(cycleData?.periodDuration || 5) + 1} – {fertileStart - 1}</p>
                  <p className="flo-phase-box-desc">Estrogen rises, boosting stamina and mental focus.</p>
                </div>

                <div className={`flo-phase-box ${phaseClass === 'ovulation' ? 'current' : ''}`}>
                  <h5 className="flo-phase-box-title" style={{ color: '#6D28D9' }}>🌟 Ovulation Window</h5>
                  <p className="flo-phase-box-days">Days {fertileStart} – {fertileEnd} (Peak: Day ~{ovulationDay})</p>
                  <p className="flo-phase-box-desc">LH hormone surge. High conception window.</p>
                </div>

                <div className={`flo-phase-box ${phaseClass === 'luteal' ? 'current' : ''}`}>
                  <h5 className="flo-phase-box-title" style={{ color: '#B45309' }}>🌙 Luteal Phase</h5>
                  <p className="flo-phase-box-days">Days {fertileEnd + 1} – {cycleLen}</p>
                  <p className="flo-phase-box-desc">Progesterone peak. Mindful nutrition &amp; PMS awareness.</p>
                </div>
              </div>
            </div>

            {/* Quick Flo Self-Care Tips */}
            <div className="flo-timeline-card">
              <h3 style={{ margin: '0 0 1rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                💡 Today's Flo Health Recommendations
              </h3>
              <p style={{ color: '#5B6B65', fontSize: '0.92rem', margin: '0 0 1rem' }}>
                {cycleData?.recommendations ||
                  'Hydrate with at least 2.5L of water daily, maintain steady sleep schedules, and track any unusual bloating, cramps, or headaches.'}
              </p>

              <div className="flo-tips-grid">
                <div className="flo-tip-box">
                  <h5>🥗 Phase-Synced Nutrition</h5>
                  <p>Incorporate magnesium-rich foods (spinach, almonds, dark chocolate) to prevent cramps and bloating.</p>
                </div>
                <div className="flo-tip-box">
                  <h5>🏃‍♀️ Energy &amp; Movement</h5>
                  <p>{phaseClass === 'menstrual' ? 'Gentle stretching and walking.' : phaseClass === 'ovulation' ? 'High intensity intervals and strength.' : 'Moderate pilates and steady-state yoga.'}</p>
                </div>
                <div className="flo-tip-box">
                  <h5>🌸 Hormonal Balance</h5>
                  <p>Keep regular sleep patterns to balance luteinizing hormone and cortisol levels.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================
            TAB 2: DETAILED 4-PHASE TIMELINE
            ======================================================== */}
        {activeTab === 'timeline' && (
          <div className="flo-timeline-card">
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#16241F', marginTop: 0 }}>
              🗓️ 4-Phase Ovulation &amp; Fertile Window Deep Dive
            </h2>
            <p style={{ color: '#5B6B65', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Your menstrual cycle consists of four distinct biological phases governed by estrogen, progesterone, LH, and FSH hormones.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', padding: '1.25rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: '#BE123C' }}>
                  🩸 Phase 1: Menstruation (Days 1–{cycleData?.periodDuration || 5})
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#5B6B65', margin: 0 }}>
                  Estrogen and progesterone drop. The uterine lining sheds. Common symptoms: cramping, lower backache, fatigue. Rest and hydration are vital.
                </p>
              </div>

              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', padding: '1.25rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: '#0F766E' }}>
                  🌿 Phase 2: Follicular Phase (Days {(cycleData?.periodDuration || 5) + 1}–{fertileStart - 1})
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#5B6B65', margin: 0 }}>
                  FSH stimulates ovarian follicles. Estrogen rises significantly, boosting metabolism, energy levels, collagen production, and positive mood.
                </p>
              </div>

              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '1.25rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: '#6D28D9' }}>
                  🌟 Phase 3: Ovulation &amp; Peak Fertile Window (Days {fertileStart}–{fertileEnd})
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#5B6B65', margin: 0 }}>
                  LH surge triggers the release of the mature egg around <strong>Day ~{ovulationDay}</strong>. Peak fertility occurs in the 5 days before and 24 hours after ovulation. Discharge appears clear and stretchy (egg-white texture).
                </p>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1.25rem', borderRadius: '16px' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: '#B45309' }}>
                  🌙 Phase 4: Luteal Phase (Days {fertileEnd + 1}–{cycleLen})
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#5B6B65', margin: 0 }}>
                  The corpus luteum produces progesterone to support potential implantation. If unfertilized, hormones decline, triggering PMS symptoms such as bloating, breast tenderness, and mood sensitivity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: FLO PCOS PATTERN SCREENER
            ======================================================== */}
        {activeTab === 'pcos' && (
          <div className="flo-pcos-card">
            <div className="flo-pcos-hero">
              <div>
                <h3 className="flo-pcos-status-title">
                  🌸 PCOS Pattern &amp; Hormonal Evaluation
                </h3>
                <p style={{ margin: 0, color: '#5B6B65', fontSize: '0.9rem' }}>
                  Statistical screener based on Rotterdam PCOS criteria: evaluates cycle irregularity, hyperandrogenic traits, and metabolic signs.
                </p>
              </div>

              <span
                className={`flo-pcos-risk-badge ${
                  activePcosCount === 0
                    ? 'low'
                    : activePcosCount >= 3
                    ? 'high'
                    : 'moderate'
                }`}
              >
                {activePcosCount === 0
                  ? '✅ Low Risk Pattern'
                  : activePcosCount >= 3
                  ? '⚠️ High Risk Pattern Detected'
                  : '⚡ Moderate Pattern Flagged'}
              </span>
            </div>

            {pcosSuccess && (
              <div style={{ background: '#D1E7DD', color: '#0F5132', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                {pcosSuccess}
              </div>
            )}

            {pcosScreening && (
              <div style={{ background: '#F8FAFA', border: '1px solid #E7ECEA', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.35rem', color: '#16241F' }}>
                  Diagnostic Summary: {pcosScreening.result}
                </h4>
                {pcosScreening.matchedFlags && pcosScreening.matchedFlags.length > 0 && (
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.88rem', color: '#9D174D' }}>
                    {pcosScreening.matchedFlags.map((f) => (
                      <li key={f.id} style={{ marginBottom: '0.25rem' }}>{f.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleSavePcos}>
              <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#16241F', margin: '0 0 0.75rem' }}>
                Select Observed Hormonal &amp; Physical Indicators:
              </h4>

              <div className="flo-checklist-grid">
                {/* 1. Acne */}
                <label className={`flo-check-card ${pcosProfile.acne ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={pcosProfile.acne}
                    onChange={(e) => setPcosProfile({ ...pcosProfile, acne: e.target.checked })}
                  />
                  <div className="flo-check-card-content">
                    <h5>✨ Persistent Adult Acne</h5>
                    <p>Cystic jawline or chin breakouts resistant to regular skincare.</p>
                  </div>
                </label>

                {/* 2. Excess Hair */}
                <label className={`flo-check-card ${pcosProfile.excessHairGrowth ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={pcosProfile.excessHairGrowth}
                    onChange={(e) => setPcosProfile({ ...pcosProfile, excessHairGrowth: e.target.checked })}
                  />
                  <div className="flo-check-card-content">
                    <h5>🦁 Excess Facial / Body Hair (Hirsutism)</h5>
                    <p>Coarse hair growth on chin, upper lip, chest, or abdomen.</p>
                  </div>
                </label>

                {/* 3. Hair Thinning */}
                <label className={`flo-check-card ${pcosProfile.hairThinning ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={pcosProfile.hairThinning}
                    onChange={(e) => setPcosProfile({ ...pcosProfile, hairThinning: e.target.checked })}
                  />
                  <div className="flo-check-card-content">
                    <h5>💇‍♀️ Scalp Hair Thinning</h5>
                    <p>Male-pattern androgenic crown shedding or widening hair part.</p>
                  </div>
                </label>

                {/* 4. Weight Gain */}
                <label className={`flo-check-card ${pcosProfile.weightGain ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={pcosProfile.weightGain}
                    onChange={(e) => setPcosProfile({ ...pcosProfile, weightGain: e.target.checked })}
                  />
                  <div className="flo-check-card-content">
                    <h5>⚖️ Unexplained Weight Resistance</h5>
                    <p>Difficulty losing weight despite calorie control; abdominal focus.</p>
                  </div>
                </label>

                {/* 5. Skin Darkening */}
                <label className={`flo-check-card ${pcosProfile.skinDarkening ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={pcosProfile.skinDarkening}
                    onChange={(e) => setPcosProfile({ ...pcosProfile, skinDarkening: e.target.checked })}
                  />
                  <div className="flo-check-card-content">
                    <h5>🧬 Acanthosis Nigricans</h5>
                    <p>Darkened velvety skin patches on the neck, armpits, or groin.</p>
                  </div>
                </label>

                {/* 6. Family History */}
                <label className={`flo-check-card ${pcosProfile.familyHistoryPCOS ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={pcosProfile.familyHistoryPCOS}
                    onChange={(e) => setPcosProfile({ ...pcosProfile, familyHistoryPCOS: e.target.checked })}
                  />
                  <div className="flo-check-card-content">
                    <h5>🩺 Family History of PCOS / Diabetes</h5>
                    <p>Mother or sister with irregular cycles, fertility issues, or T2D.</p>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5B6B65', marginBottom: '0.4rem' }}>
                  Personal Clinical Notes &amp; Observations
                </label>
                <textarea
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '12px', border: '1px solid #DDE4E2', fontFamily: 'inherit', fontSize: '0.9rem' }}
                  placeholder="Record any pelvic ultrasound results, hormonal bloodwork (LH/FSH ratio, testosterone), or doctor advice..."
                  value={pcosProfile.notes}
                  onChange={(e) => setPcosProfile({ ...pcosProfile, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" className="flo-btn-log" disabled={pcosSaving}>
                  {pcosSaving ? 'Evaluating Patterns…' : 'Save & Re-evaluate PCOS Risk'}
                </button>

                {activePcosCount >= 2 && (
                  <button
                    type="button"
                    className="flo-btn-settings"
                    onClick={() => navigate('/appointments')}
                  >
                    📅 Schedule Gynecologist Consultation
                  </button>
                )}
              </div>
            </form>

            {/* Flo PCOS Nutrition & Lifestyle Tips */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #E7ECEA', paddingTop: '1.5rem' }}>
              <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#16241F', margin: '0 0 1rem' }}>
                🌿 Flo Health Clinical Tips for PCOS &amp; Hormone Harmony
              </h4>
              <div className="flo-tips-grid">
                <div className="flo-tip-box">
                  <h5>🥗 Low-Glycemic Nutrition</h5>
                  <p>Prioritize complex carbohydrates with high fiber to prevent insulin spikes that drive excess androgen production.</p>
                </div>
                <div className="flo-tip-box">
                  <h5>🍵 Spearmint Tea &amp; Zinc</h5>
                  <p>Clinical studies show 2 cups of spearmint tea daily significantly reduces free testosterone levels in women with PCOS.</p>
                </div>
                <div className="flo-tip-box">
                  <h5>🏋️‍♀️ Low-Cortisol Strength Training</h5>
                  <p>Favor progressive resistance training over intense HIIT cardio to improve insulin sensitivity without raising cortisol.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: LOG HISTORY
            ======================================================== */}
        {activeTab === 'history' && (
          <div>
            {(!cycleData?.dailyLogs || cycleData.dailyLogs.length === 0) ? (
              <div className="cycle-empty">
                <span style={{ fontSize: '2.5rem' }}>📋</span>
                <p className="cycle-empty-title">No symptom logs recorded yet</p>
                <p>Click "+ Log Today's Symptoms" to record bloating, headaches, flow, and daily mood.</p>
              </div>
            ) : (
              <div>
                {cycleData.dailyLogs.map((log) => {
                  const physicals = (log.symptoms || []).filter((s) => !s.startsWith('Mood: '));
                  const moods = (log.symptoms || [])
                    .filter((s) => s.startsWith('Mood: '))
                    .map((s) => s.replace('Mood: ', ''));

                  return (
                    <div key={log._id} className="flo-history-item">
                      <div>
                        <h4 className="flo-history-date">{formatDate(log.date)}</h4>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span className={`cycle-flow-tag flow-${log.flow || 'none'}`}>
                            {log.flow === 'none' ? 'No Flow' : `${log.flow?.toUpperCase()} Flow`}
                          </span>

                          {physicals.map((sym) => (
                            <span key={sym} className="cycle-symptom-chip">
                              {sym}
                            </span>
                          ))}

                          {moods.map((m) => (
                            <span key={m} className="cycle-symptom-chip" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                              😊 {m}
                            </span>
                          ))}
                        </div>

                        {log.note && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#5B6B65', fontStyle: 'italic' }}>
                            “{log.note}”
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="cycle-btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        onClick={() => openLogForDate(toInputDate(log.date))}
                      >
                        Edit Log
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            MODAL: DAILY SYMPTOM & MOOD LOGGER (FLO STYLE)
            ======================================================== */}
        {showLogModal && (
          <div className="flo-modal-overlay" onClick={() => setShowLogModal(false)}>
            <div className="flo-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="flo-modal-header">
                <h2>📝 Log Daily Symptoms &amp; Mood</h2>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  onClick={() => setShowLogModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDailyLog}>
                {/* Date */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5B6B65', marginBottom: '0.35rem' }}>
                    Log Date
                  </label>
                  <input
                    type="date"
                    className="dash-input"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DDE4E2' }}
                    value={logDate}
                    onChange={(e) => openLogForDate(e.target.value)}
                    required
                  />
                </div>

                {/* 1. Flow Intensity */}
                <div className="flo-symptom-section">
                  <div className="flo-section-label">
                    <span>🩸 Flow Intensity</span>
                  </div>
                  <div className="flo-pills-grid">
                    {FLO_FLOWS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`flo-pill-btn ${selectedFlow === f.id ? 'selected' : ''}`}
                        onClick={() => setSelectedFlow(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Physical Symptoms (Bloating, Headache, Cramps, etc.) */}
                <div className="flo-symptom-section">
                  <div className="flo-section-label">
                    <span>😣 Physical Symptoms (Bloating, Headache, Cramps...)</span>
                  </div>
                  <div className="flo-pills-grid">
                    {FLO_SYMPTOMS.map((sym) => (
                      <button
                        key={sym.id}
                        type="button"
                        className={`flo-pill-btn ${selectedSymptoms.includes(sym.id) ? 'selected' : ''}`}
                        onClick={() => toggleSymptom(sym.id)}
                      >
                        {sym.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Mood & Emotion */}
                <div className="flo-symptom-section">
                  <div className="flo-section-label">
                    <span>😊 Mood &amp; Emotional State</span>
                  </div>
                  <div className="flo-pills-grid">
                    {FLO_MOODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`flo-pill-btn ${selectedMoods.includes(m.id) ? 'selected' : ''}`}
                        onClick={() => toggleMood(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Notes */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5B6B65', marginBottom: '0.35rem' }}>
                    Personal Daily Notes
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '70px', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DDE4E2', fontFamily: 'inherit', fontSize: '0.88rem' }}
                    placeholder="Record any cravings, energy fluctuations, or medication doses taken today..."
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button type="button" className="flo-btn-settings" onClick={() => setShowLogModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="flo-btn-log" disabled={savingLog}>
                    {savingLog ? 'Saving…' : 'Save Daily Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: EDIT CYCLE SETTINGS (FLO STYLE)
            ======================================================== */}
        {showSettingsModal && (
          <div className="flo-modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="flo-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div className="flo-modal-header">
                <h2>⚙️ Menstruation Cycle Settings</h2>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                  onClick={() => setShowSettingsModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSettings}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5B6B65', marginBottom: '0.35rem' }}>
                    First Day of Last Period *
                  </label>
                  <input
                    type="date"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DDE4E2' }}
                    value={settingsForm.lastPeriodStart}
                    onChange={(e) => setSettingsForm({ ...settingsForm, lastPeriodStart: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5B6B65', marginBottom: '0.35rem' }}>
                      Cycle Length (Days)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="45"
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DDE4E2' }}
                      value={settingsForm.cycleLength}
                      onChange={(e) => setSettingsForm({ ...settingsForm, cycleLength: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5B6B65', marginBottom: '0.35rem' }}>
                      Period Bleeding Days
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DDE4E2' }}
                      value={settingsForm.periodDuration}
                      onChange={(e) => setSettingsForm({ ...settingsForm, periodDuration: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button type="button" className="flo-btn-settings" onClick={() => setShowSettingsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="flo-btn-log" disabled={savingSettings}>
                    {savingSettings ? 'Updating…' : 'Save Cycle Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}