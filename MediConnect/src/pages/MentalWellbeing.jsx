import { useEffect, useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../api/authApi';
import {
  createMoodEntry,
  fetchMoodEntries,
  fetchMoodAnalytics,
  deleteMoodEntry,
} from '../api/moodApi';
import {
  submitCheckin,
  fetchCheckinHistory,
  fetchCheckinAnalytics,
} from '../api/wellbeingApi';
import '../styles/MentalWellbeing.css';

// --- Mood Constants ---
const MOOD_OPTIONS = [
  { value: 'very_happy', label: 'Very Happy', emoji: '😄', score: 5, color: '#2F9E44' },
  { value: 'happy', label: 'Happy', emoji: '🙂', score: 4, color: '#51CF66' },
  { value: 'calm', label: 'Calm', emoji: '😌', score: 4, color: '#20C997' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', score: 3, color: '#868E96' },
  { value: 'stressed', label: 'Stressed', emoji: '😫', score: 2, color: '#FD7E14' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', score: 2, color: '#FA5252' },
  { value: 'sad', label: 'Sad', emoji: '😢', score: 2, color: '#4DABF7' },
  { value: 'very_sad', label: 'Very Sad', emoji: '😭', score: 1, color: '#339AF0' },
  { value: 'angry', label: 'Angry', emoji: '😡', score: 1, color: '#E03131' },
];

const EMOTION_TAGS = [
  'Stress',
  'Anxiety',
  'Loneliness',
  'Anger',
  'Sadness',
  'Happiness',
  'Motivation',
  'Calmness',
];

// --- Questionnaire Definitions ---
const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const SCREENINGS = {
  depression: {
    id: 'depression',
    title: 'Depression Screening',
    subtitle: 'Assessing patterns in mood, motivation, energy, sleep, and appetite over the last 2 weeks.',
    icon: '🌧️',
    questions: [
      'Little interest or pleasure in doing things you usually enjoy?',
      'Feeling down, depressed, or hopeless?',
      'Trouble falling or staying asleep, or sleeping too much?',
      'Feeling tired or having little to no energy?',
      'Poor appetite or overeating?',
      'Feeling bad about yourself — or that you are a failure or have let yourself/family down?',
      'Trouble concentrating on things, such as reading or watching television?',
      'Moving or speaking so slowly that others could have noticed? Or being fidgety/restless?',
      'Thoughts that you would be better off dead, or of hurting yourself in some way?',
    ],
  },
  anxiety: {
    id: 'anxiety',
    title: 'Anxiety Screening',
    subtitle: 'Assessing patterns in tension, uncontrollable worry, restlessness, and relaxation over the last 2 weeks.',
    icon: '⚡',
    questions: [
      'Feeling nervous, anxious, or on edge?',
      'Not being able to stop or control worrying?',
      'Worrying too much about different things?',
      'Trouble relaxing or unwinding?',
      'Being so restless that it is hard to sit still?',
      'Becoming easily annoyed or irritable?',
      'Feeling afraid as if something awful might happen?',
    ],
  },
  ocd: {
    id: 'ocd',
    title: 'OCD-Related Screening',
    subtitle: 'Assessing recurring intrusive thoughts, repetitive checking or rituals, and daily distress.',
    icon: '🔄',
    questions: [
      'Unpleasant, intrusive, or distressing thoughts that enter your mind repeatedly against your will?',
      'Strong urges to perform repetitive behaviors (e.g., checking, washing, ordering, or repeating actions)?',
      'Feeling significant tension or distress if repetitive rituals or routines cannot be completed?',
      'Finding it very difficult to dismiss or ignore unwanted repetitive thoughts?',
      'Spending more than 1 hour per day engaged in repetitive thoughts or compulsive routines?',
      'Repetitive thought patterns or rituals interfering with your work, studies, or daily relationships?',
      'An intense need for symmetry, precision, or things feeling "just right"?',
    ],
  },
};

export default function MentalWellbeing() {
  const navigate = useNavigate();
  const [user] = useState(() => getUser());
  const [activeTab, setActiveTab] = useState('mood'); // 'mood', 'checkin', 'history'

  // Unique accessible IDs for inputs
  const customDateTimeId = useId();
  const moodReflectionNoteId = useId();

  // Mood Tracker State
  const [timeframe, setTimeframe] = useState('7d');
  const [moodEntries, setMoodEntries] = useState([]);
  const [moodAnalytics, setMoodAnalytics] = useState(null);
  const [loadingMood, setLoadingMood] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const [moodMessage, setMoodMessage] = useState({ text: '', isError: false });

  // Mood Form State
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [moodNote, setMoodNote] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');

  // Screening State
  const [selectedScreening, setSelectedScreening] = useState(null); // 'depression', 'anxiety', 'ocd'
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [checkinAnalytics, setCheckinAnalytics] = useState(null);
  const [loadingCheckins, setLoadingCheckins] = useState(true);

  // Load Data
  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      try {
        setLoadingMood(true);
        const [entries, analytics] = await Promise.all([
          fetchMoodEntries(timeframe),
          fetchMoodAnalytics(timeframe),
        ]);
        if (isMounted) {
          setMoodEntries(entries || []);
          setMoodAnalytics(analytics || null);
          setLoadingMood(false);
        }
      } catch {
        if (isMounted) setLoadingMood(false);
      }

      try {
        setLoadingCheckins(true);
        const [history, analytics] = await Promise.all([
          fetchCheckinHistory(),
          fetchCheckinAnalytics(),
        ]);
        if (isMounted) {
          setCheckinHistory(history || []);
          setCheckinAnalytics(analytics || null);
          setLoadingCheckins(false);
        }
      } catch {
        if (isMounted) setLoadingCheckins(false);
      }
    }

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  // Reload Mood Analytics & Entries
  async function reloadMood(newTimeframe = timeframe) {
    setLoadingMood(true);
    try {
      const [entries, analytics] = await Promise.all([
        fetchMoodEntries(newTimeframe),
        fetchMoodAnalytics(newTimeframe),
      ]);
      setMoodEntries(entries || []);
      setMoodAnalytics(analytics || null);
    } catch (err) {
      setMoodMessage({ text: err.message, isError: true });
    } finally {
      setLoadingMood(false);
    }
  }

  // Reload Screening History
  async function reloadCheckins() {
    setLoadingCheckins(true);
    try {
      const [history, analytics] = await Promise.all([
        fetchCheckinHistory(),
        fetchCheckinAnalytics(),
      ]);
      setCheckinHistory(history || []);
      setCheckinAnalytics(analytics || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCheckins(false);
    }
  }

  // --- Mood Handlers ---
  function toggleEmotion(emotion) {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  }

  async function handleSaveMood(e) {
    e.preventDefault();
    if (!selectedMood) {
      setMoodMessage({ text: 'Please select how you are feeling right now.', isError: true });
      return;
    }

    setSavingMood(true);
    setMoodMessage({ text: '', isError: false });

    try {
      await createMoodEntry({
        mood: selectedMood,
        emotions: selectedEmotions,
        note: moodNote,
        entryDate: customDateTime ? new Date(customDateTime) : new Date(),
      });

      setSelectedMood('');
      setSelectedEmotions([]);
      setMoodNote('');
      setCustomDateTime('');
      setMoodMessage({ text: '✨ Your mood entry has been recorded.', isError: false });
      await reloadMood();
    } catch (err) {
      setMoodMessage({ text: err.message, isError: true });
    } finally {
      setSavingMood(false);
    }
  }

  async function handleDeleteMood(id) {
    if (!window.confirm('Are you sure you want to remove this mood entry?')) return;
    try {
      await deleteMoodEntry(id);
      await reloadMood();
    } catch (err) {
      setMoodMessage({ text: err.message, isError: true });
    }
  }

  // --- Screening Handlers ---
  function startScreening(type) {
    setSelectedScreening(type);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setCheckinResult(null);
  }

  function handleSelectAnswer(val, label) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: { value: val, label },
    }));
  }

  function handleNextQuestion() {
    const totalQuestions = SCREENINGS[selectedScreening].questions.length;
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  }

  function handlePrevQuestion() {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  }

  async function handleSubmitScreening() {
    const screeningDef = SCREENINGS[selectedScreening];
    const totalQuestions = screeningDef.questions.length;

    // Verify all answered
    const responses = [];
    for (let i = 0; i < totalQuestions; i++) {
      if (!answers[i]) {
        alert(`Please answer question ${i + 1} before submitting.`);
        setCurrentQuestionIdx(i);
        return;
      }
      responses.push({
        questionIndex: i,
        questionText: screeningDef.questions[i],
        answerValue: answers[i].value,
        answerLabel: answers[i].label,
      });
    }

    setSubmittingCheckin(true);
    try {
      const result = await submitCheckin({
        screeningType: selectedScreening,
        responses,
      });
      setCheckinResult(result);
      await reloadCheckins();
    } catch (err) {
      alert(err.message || 'Failed to submit check-in questionnaire.');
    } finally {
      setSubmittingCheckin(false);
    }
  }

  function closeScreeningModal() {
    setSelectedScreening(null);
    setCheckinResult(null);
    setAnswers({});
    setCurrentQuestionIdx(0);
  }

  // Render SVG Trend Graph for Mood
  function renderMoodTrendSvg() {
    if (!moodAnalytics || !moodAnalytics.trendSeries || moodAnalytics.trendSeries.length === 0) {
      return (
        <div className="mw-chart-empty">
          <p>Not enough mood check-ins in this period to display a trend graph.</p>
          <span>Log your mood above to start seeing your trend trajectory!</span>
        </div>
      );
    }

    const series = moodAnalytics.trendSeries;
    const width = 640;
    const height = 180;
    const padding = 36;

    const minScore = 1;
    const maxScore = 5;

    const points = series.map((item, idx) => {
      const x =
        series.length === 1
          ? width / 2
          : padding + (idx / (series.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((item.averageScore - minScore) / (maxScore - minScore)) * (height - padding * 2);
      return { ...item, x, y };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <div className="mw-svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="mw-trend-svg">
          {/* Y-axis gridlines & labels */}
          {[1, 2, 3, 4, 5].map((lvl) => {
            const y = height - padding - ((lvl - minScore) / (maxScore - minScore)) * (height - padding * 2);
            return (
              <g key={lvl}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E7ECEA" strokeDasharray="3 3" />
                <text x={padding - 8} y={y + 4} textAnchor="end" className="mw-svg-axis-label">
                  {lvl === 5 ? '😄 5' : lvl === 3 ? '😐 3' : lvl === 1 ? '😭 1' : lvl}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#moodGradient)"
              opacity="0.25"
            />
          )}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#146356" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Trend line */}
          {points.length > 1 && (
            <path d={pathD} fill="none" stroke="#146356" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="mw-svg-point-group">
              <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#146356" strokeWidth="2.5" />
              <title>{`${pt.displayDate}: Average Score ${pt.averageScore}/5 (${pt.entriesCount} entry)`}</title>
              <text x={pt.x} y={height - 10} textAnchor="middle" className="mw-svg-x-label">
                {pt.displayDate}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="mw-page">
      <div className="mw-shell">
        {/* Navigation Bar */}
        <header className="mw-nav-bar">
          <button className="mw-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <div className="mw-brand">
            <span className="mw-brand-icon">🧠</span>
            <span className="mw-brand-title">Mental Well-being</span>
          </div>
          <div className="mw-nav-user">
            <span className="mw-user-name">{user?.name || 'Patient'}</span>
            <button
              className="mw-logout-btn"
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </div>
        </header>

        {/* Hero Header */}
        <section className="mw-hero">
          <div className="mw-hero-content">
            <span className="mw-hero-badge">Self-Awareness & Monitoring</span>
            <h1>Mood & Mental Well-being Hub</h1>
            <p>
              Track your emotional rhythms, identify symptom patterns, and take structured check-ins for depression, anxiety, and OCD-related patterns.
            </p>
          </div>

          <div className="mw-safety-card">
            <div className="mw-safety-icon">🛡️</div>
            <div>
              <strong>Self-Monitoring Notice</strong>
              <p>
                This hub is a self-awareness tool, not a diagnostic system. Always consult a qualified physician or therapist for medical advice.
              </p>
            </div>
          </div>
        </section>

        {/* Tab Switcher */}
        <nav className="mw-tabs">
          <button
            className={`mw-tab-btn ${activeTab === 'mood' ? 'active' : ''}`}
            onClick={() => setActiveTab('mood')}
          >
            📈 Mood & Emotion Tracker
          </button>
          <button
            className={`mw-tab-btn ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkin')}
          >
            📝 Well-being Check-ins
          </button>
          <button
            className={`mw-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📊 Screening History & Trends
          </button>
        </nav>

        {/* ==================== TAB 1: MOOD TRACKER & TRENDS ==================== */}
        {activeTab === 'mood' && (
          <div className="mw-tab-content">
            {/* Feedback Message */}
            {moodMessage.text && (
              <div
                className={`mw-banner ${moodMessage.isError ? 'error' : 'success'}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{moodMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setMoodMessage({ text: '', isError: false })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Mood Check-in Form Card */}
            <div className="mw-card mw-mood-form-card">
              <div className="mw-card-header">
                <div>
                  <span className="mw-card-eyebrow">Daily Check-in</span>
                  <h2>How are you feeling right now?</h2>
                </div>
                <span className="mw-time-label">Log once or multiple times daily</span>
              </div>

              <form onSubmit={handleSaveMood}>
                {/* 1. Mood Emoji Selector */}
                <p className="mw-field-title">1. Select your primary mood:</p>
                <div className="mw-mood-grid">
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`mw-mood-btn ${selectedMood === opt.value ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(opt.value)}
                    >
                      <span className="mw-mood-emoji">{opt.emoji}</span>
                      <span className="mw-mood-name">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* 2. Optional Emotion Tags */}
                <p className="mw-field-title" style={{ marginTop: '1.4rem' }}>
                  2. Select emotion tags (optional):
                </p>
                <div className="mw-tags-wrap">
                  {EMOTION_TAGS.map((tag) => {
                    const isSelected = selectedEmotions.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`mw-tag-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleEmotion(tag)}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* 3. Reflection Note & Time */}
                <div className="mw-form-row" style={{ marginTop: '1.4rem' }}>
                  <div className="mw-field" style={{ flex: 2 }}>
                    <label htmlFor={moodReflectionNoteId}>Short reflection / note (optional):</label>
                    <input
                      id={moodReflectionNoteId}
                      type="text"
                      placeholder="e.g. Felt relaxed after a morning walk, slight work pressure in the afternoon"
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                  <div className="mw-field" style={{ flex: 1 }}>
                    <label htmlFor={customDateTimeId}>Date & Time:</label>
                    <input
                      id={customDateTimeId}
                      type="datetime-local"
                      value={customDateTime}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mw-form-footer">
                  <button type="submit" className="mw-btn-primary" disabled={savingMood || !selectedMood}>
                    {savingMood ? 'Recording…' : 'Save Mood Check-in'}
                  </button>
                </div>
              </form>
            </div>

            {/* Mood Trends View */}
            <div className="mw-card mw-trends-card">
              <div className="mw-card-header">
                <div>
                  <span className="mw-card-eyebrow">Trend Analytics</span>
                  <h2>Your Mood Trends & Patterns</h2>
                </div>
                {/* Timeframe Filter Pills */}
                <div className="mw-timeframe-pills">
                  {['7d', '30d', '90d'].map((tf) => (
                    <button
                      key={tf}
                      className={`mw-tf-btn ${timeframe === tf ? 'active' : ''}`}
                      onClick={() => {
                        setTimeframe(tf);
                        reloadMood(tf);
                      }}
                    >
                      {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : 'Last 3 Months'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Metric Stats */}
              <div className="mw-metrics-grid">
                <div className="mw-metric-box">
                  <span className="mw-metric-label">Average Mood</span>
                  <span className="mw-metric-val">
                    {moodAnalytics?.averageScore ? `${moodAnalytics.averageScore} / 5` : '—'}
                  </span>
                  <span className="mw-metric-sub">{moodAnalytics?.averageMoodLabel || 'No data'}</span>
                </div>

                <div className="mw-metric-box">
                  <span className="mw-metric-label">Most Frequent Emotion</span>
                  <span className="mw-metric-val">{moodAnalytics?.mostFrequentEmotion || '—'}</span>
                  <span className="mw-metric-sub">
                    {moodAnalytics?.topEmotions?.[0]
                      ? `${moodAnalytics.topEmotions[0].count} time(s)`
                      : 'None recorded'}
                  </span>
                </div>

                <div className="mw-metric-box">
                  <span className="mw-metric-label">Check-ins</span>
                  <span className="mw-metric-val">{moodAnalytics?.totalEntries || 0}</span>
                  <span className="mw-metric-sub">in selected period</span>
                </div>

                <div className="mw-metric-box">
                  <span className="mw-metric-label">Mood Direction</span>
                  <span className="mw-metric-val">
                    {moodAnalytics?.trajectory === 'Improving'
                      ? '📈 Improving'
                      : moodAnalytics?.trajectory === 'Decreasing'
                      ? '📉 Declining'
                      : '➡️ Stable'}
                  </span>
                  <span className="mw-metric-sub">Trajectory indicator</span>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="mw-chart-container">
                <h4 className="mw-chart-title">Daily Average Mood (1 to 5 Scale)</h4>
                {loadingMood ? (
                  <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
                    Loading mood trends…
                  </p>
                ) : (
                  renderMoodTrendSvg()
                )}
              </div>

              <p className="mw-disclaimer-text">
                ℹ️ Mood trends are intended for personal self-awareness and lifestyle monitoring. They do not constitute a psychiatric or psychological diagnosis.
              </p>
            </div>

            {/* Mood History Timeline */}
            <div className="mw-card">
              <div className="mw-card-header">
                <div>
                  <span className="mw-card-eyebrow">Log History</span>
                  <h2>Recent Mood Records</h2>
                </div>
                <span className="mw-time-label">{moodEntries.length} total entries</span>
              </div>

              {moodEntries.length === 0 ? (
                <div className="mw-empty-state">
                  <p>No mood check-ins recorded yet.</p>
                  <span>Use the form above to record your first check-in!</span>
                </div>
              ) : (
                <div className="mw-entries-list">
                  {moodEntries.map((entry) => {
                    const moodObj = MOOD_OPTIONS.find((m) => m.value === entry.mood);
                    const formattedDate = new Date(entry.entryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const formattedTime = new Date(entry.entryDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={entry._id} className="mw-entry-item">
                        <div className="mw-entry-left">
                          <span className="mw-entry-emoji">{moodObj?.emoji || '😐'}</span>
                          <div>
                            <div className="mw-entry-title">
                              <strong>{moodObj?.label || entry.mood}</strong>
                              <span className="mw-entry-time">
                                {formattedDate} at {formattedTime}
                              </span>
                            </div>
                            {entry.emotions && entry.emotions.length > 0 && (
                              <div className="mw-entry-tags">
                                {entry.emotions.map((t) => (
                                  <span key={t} className="mw-entry-tag">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {entry.note && <p className="mw-entry-note">“{entry.note}”</p>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mw-delete-btn"
                          title="Delete entry"
                          onClick={() => handleDeleteMood(entry._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MENTAL WELL-BEING CHECK-INS ==================== */}
        {activeTab === 'checkin' && (
          <div className="mw-tab-content">
            {/* Disclaimer Alert */}
            <div className="mw-card mw-screening-intro-card">
              <div className="mw-intro-header">
                <span style={{ fontSize: '1.8rem' }}>📋</span>
                <div>
                  <h3>Structured Mental Well-being Screenings</h3>
                  <p>
                    These structured check-ins are designed to help you notice patterns in your emotional well-being over time. They are self-awareness screening tools, not clinical diagnoses.
                  </p>
                </div>
              </div>
              <div className="mw-safety-banner-small">
                <strong>Important:</strong> If you are experiencing overwhelming distress, thoughts of self-harm, or need immediate assistance, please call or text <strong>988</strong> (in the US & Canada) or contact your local emergency services immediately.
              </div>
            </div>

            {/* Screening Cards Grid */}
            <div className="mw-screenings-grid">
              {Object.values(SCREENINGS).map((s) => {
                const typeAnalytics = checkinAnalytics?.[s.id];
                return (
                  <div key={s.id} className="mw-screening-card">
                    <div className="mw-sc-header">
                      <span className="mw-sc-icon">{s.icon}</span>
                      <span className="mw-sc-questions">{s.questions.length} Questions</span>
                    </div>
                    <h3>{s.title}</h3>
                    <p>{s.subtitle}</p>

                    <div className="mw-sc-meta">
                      <span>Completed: {typeAnalytics?.count || 0} time(s)</span>
                      {typeAnalytics?.latest && (
                        <span className="mw-sc-latest">
                          Latest: {typeAnalytics.latest.indicationLevel.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <button className="mw-btn-primary full-width" onClick={() => startScreening(s.id)}>
                      Start {s.title} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: SCREENING HISTORY & PROGRESSION ==================== */}
        {activeTab === 'history' && (
          <div className="mw-tab-content">
            {/* History Overview */}
            <div className="mw-card">
              <div className="mw-card-header">
                <div>
                  <span className="mw-card-eyebrow">Screening Logs</span>
                  <h2>Past Mental Well-being Check-ins</h2>
                </div>
                <button className="mw-btn-secondary" onClick={() => setActiveTab('checkin')}>
                  + Take New Screening
                </button>
              </div>

              {loadingCheckins ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
                  Loading history…
                </p>
              ) : checkinHistory.length === 0 ? (
                <div className="mw-empty-state">
                  <p>No screening check-ins taken yet.</p>
                  <span>Select a questionnaire in the Well-being Check-ins tab to get started.</span>
                </div>
              ) : (
                <div className="mw-history-table-wrap">
                  <table className="mw-history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Screening Type</th>
                        <th>Score</th>
                        <th>Indication Level</th>
                        <th>Comparison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkinHistory.map((item) => {
                        const formattedDate = new Date(item.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const formattedTime = new Date(item.completedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const levelBadgeClass =
                          item.indicationLevel === 'minimal'
                            ? 'lvl-minimal'
                            : item.indicationLevel === 'mild'
                            ? 'lvl-mild'
                            : item.indicationLevel === 'moderate'
                            ? 'lvl-moderate'
                            : 'lvl-higher';

                        return (
                          <tr key={item._id}>
                            <td>
                              <strong>{formattedDate}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formattedTime}</div>
                            </td>
                            <td>
                              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                {item.screeningType}
                              </span>
                            </td>
                            <td>
                              <strong>{item.totalScore}</strong> / {item.maxScore}
                            </td>
                            <td>
                              <span className={`mw-level-badge ${levelBadgeClass}`}>
                                {item.indicationLevel.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`mw-comp-badge ${
                                  item.comparison === 'Improving'
                                    ? 'comp-improving'
                                    : item.comparison === 'Increasing'
                                    ? 'comp-increasing'
                                    : 'comp-stable'
                                }`}
                              >
                                {item.comparison === 'Improving'
                                  ? '📉 Improving'
                                  : item.comparison === 'Increasing'
                                  ? '📈 Increasing'
                                  : '➡️ ' + item.comparison}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== SCREENING WIZARD MODAL ==================== */}
      {selectedScreening && (
        <div className="mw-modal-overlay" onClick={closeScreeningModal}>
          <div className="mw-modal-card wizard-modal" onClick={(e) => e.stopPropagation()}>
            {/* Wizard Header */}
            <div className="mw-modal-header">
              <div>
                <span className="mw-card-eyebrow">Self-Awareness Check-in</span>
                <h3>{SCREENINGS[selectedScreening].title}</h3>
              </div>
              <button className="mw-close-btn" onClick={closeScreeningModal}>✕</button>
            </div>

            {/* Results Screen */}
            {checkinResult ? (
              <div className="mw-result-body">
                {/* Emergency Crisis Alert if Triggered */}
                {checkinResult.hasSafetyAlert && (
                  <div className="mw-crisis-box">
                    <h4>🚨 Immediate Support & Crisis Helplines</h4>
                    <p>
                      You indicated thoughts of severe distress or self-harm. Please know that you are not alone and free, confidential support is available 24/7.
                    </p>
                    <div className="mw-crisis-contacts">
                      <div>
                        <strong>National Suicide & Crisis Lifeline:</strong> Call or text <strong>988</strong> (USA & Canada)
                      </div>
                      <div>
                        <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong>
                      </div>
                      <div>
                        <strong>Emergency Medical Services:</strong> Dial <strong>911</strong> or visit the nearest emergency room.
                      </div>
                    </div>
                  </div>
                )}

                <div className="mw-result-header">
                  <span className="mw-result-score-badge">
                    Score: {checkinResult.totalScore} / {checkinResult.maxScore}
                  </span>
                  <span
                    className={`mw-level-badge ${
                      checkinResult.indicationLevel === 'minimal'
                        ? 'lvl-minimal'
                        : checkinResult.indicationLevel === 'mild'
                        ? 'lvl-mild'
                        : checkinResult.indicationLevel === 'moderate'
                        ? 'lvl-moderate'
                        : 'lvl-higher'
                    }`}
                  >
                    {checkinResult.indicationLevel.toUpperCase()} INDICATION
                  </span>
                </div>

                <div className="mw-result-summary">
                  <h4>Interpretation</h4>
                  <p>{checkinResult.summary}</p>
                </div>

                {checkinResult.recommendations && checkinResult.recommendations.length > 0 && (
                  <div className="mw-result-recs">
                    <h4>Recommended Next Steps</h4>
                    <ul>
                      {checkinResult.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mw-disclaimer-box">
                  <strong>Notice:</strong> This screening is not a clinical diagnosis. For a formal evaluation, please share these results with a qualified healthcare professional.
                </div>

                <div className="mw-modal-actions">
                  <button className="mw-btn-primary" onClick={closeScreeningModal}>
                    Done & Return to Hub
                  </button>
                </div>
              </div>
            ) : (
              /* Questionnaire Step by Step */
              <div className="mw-wizard-body">
                <div className="mw-progress-bar">
                  <div
                    className="mw-progress-fill"
                    style={{
                      width: `${
                        ((currentQuestionIdx + 1) /
                          SCREENINGS[selectedScreening].questions.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="mw-progress-label">
                  Question {currentQuestionIdx + 1} of{' '}
                  {SCREENINGS[selectedScreening].questions.length}
                </div>

                <div className="mw-question-box">
                  <p className="mw-question-text">
                    “Over the last 2 weeks, how often have you been bothered by:{' '}
                    <strong>
                      {SCREENINGS[selectedScreening].questions[currentQuestionIdx]}
                    </strong>”
                  </p>

                  <div className="mw-answers-list">
                    {FREQUENCY_OPTIONS.map((opt) => {
                      const isSelected =
                        answers[currentQuestionIdx]?.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`mw-answer-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectAnswer(opt.value, opt.label)}
                        >
                          <span className="mw-answer-radio">
                            {isSelected ? '●' : '○'}
                          </span>
                          <span className="mw-answer-label">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mw-wizard-footer">
                  <button
                    type="button"
                    className="mw-btn-secondary"
                    disabled={currentQuestionIdx === 0}
                    onClick={handlePrevQuestion}
                  >
                    ← Previous
                  </button>

                  {currentQuestionIdx <
                  SCREENINGS[selectedScreening].questions.length - 1 ? (
                    <button
                      type="button"
                      className="mw-btn-primary"
                      disabled={!answers[currentQuestionIdx]}
                      onClick={handleNextQuestion}
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mw-btn-primary"
                      disabled={submittingCheckin || !answers[currentQuestionIdx]}
                      onClick={handleSubmitScreening}
                    >
                      {submittingCheckin ? 'Evaluating…' : 'Submit & View Results ✓'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
