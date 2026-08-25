import { useEffect, useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUser,
  clearSession,
  fetchUserProfile,
  updateEmergencyContact,
  sendEmergencyAlert,
  fetchPersonalizedHealthTips,
  saveSession,
  downloadComprehensiveHealthProfilePDF,
} from '../api/authApi';
import { fetchReminders } from '../api/reminderApi';
import {
  bookAppointment,
  fetchPatientAppointments,
  fetchAvailableDoctors,
  cancelAppointment,
} from '../api/appointmentApi';
import {
  fetchCycleData,
  updateCycleSettings,
  logDailyCycleSymptom,
} from '../api/cycleApi';
import '../styles/Dashboard.css';

const EMERGENCY_SITUATIONS = [
  { id: 'heart', label: '🫀 Suspected Heart Attack / Severe Chest Pain' },
  { id: 'breathing', label: '🫁 Severe Breathing Difficulty / Asthma Attack' },
  { id: 'fall', label: '🩹 Sudden Fall / Acute Physical Injury' },
  { id: 'allergy', label: '⚠️ Severe Allergic Reaction (Anaphylaxis)' },
  { id: 'other', label: '🚨 Other Urgent Medical Emergency' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getUser());
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [healthTips, setHealthTips] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'ai', 'tips', 'profile', 'emergency_alert', 'emergency_settings', 'book_appt'

  // Accessible IDs for inputs
  const emNameId = useId();
  const emEmailId = useId();
  const emPhoneId = useId();
  const emRelId = useId();
  const emSitId = useId();
  const emNotesId = useId();
  const apptDoctorId = useId();
  const apptDateId = useId();
  const apptTimeId = useId();
  const apptTypeId = useId();
  const apptReasonId = useId();

  // AI Assistant Chat State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChat, setAiChat] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your MediConnect AI Health Assistant. How can I help you today? You can ask me about medication instructions, symptom guidance, or general wellness advice.',
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Emergency Alert Form State
  const [emergencySituation, setEmergencySituation] = useState(EMERGENCY_SITUATIONS[0].label);
  const [emergencyNote, setEmergencyNote] = useState('');
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState({ text: '', isError: false });

  // Emergency Contact Settings State
  const [emergencyContactForm, setEmergencyContactForm] = useState({
    name: user?.emergencyContact?.name || '',
    email: user?.emergencyContact?.email || '',
    phone: user?.emergencyContact?.phone || '',
    relationship: user?.emergencyContact?.relationship || 'Family / Guardian',
  });
  const [savingContact, setSavingContact] = useState(false);

  // Appointment Booking State
  const [doctorsList, setDoctorsList] = useState([]);
  const [apptForm, setApptForm] = useState({
    doctorId: '',
    doctorName: 'Dr. Sarah Jenkins, MD',
    doctorSpecialty: 'General Practice',
    date: '',
    time: '10:00',
    reason: '',
    type: 'consultation',
  });
  const [bookingAppt, setBookingAppt] = useState(false);

  // Cycle Tracker State
  const [cycleData, setCycleData] = useState(null);
  const [cycleSettingsForm, setCycleSettingsForm] = useState({
    lastPeriodStart: '',
    cycleLength: 28,
    periodDuration: 5,
  });
  const [cycleLogForm, setCycleLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    flow: 'medium',
    symptoms: [],
    note: '',
  });
  const [cycleTab, setCycleTab] = useState('insights'); // 'insights', 'log', 'settings'
  const [savingCycle, setSavingCycle] = useState(false);
  const [downloadingProfilePdf, setDownloadingProfilePdf] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [rems, tipsRes, appts, profile, docs, cycleRes] = await Promise.all([
          fetchReminders().catch(() => []),
          fetchPersonalizedHealthTips().catch(() => ({ tips: [] })),
          fetchPatientAppointments().catch(() => []),
          fetchUserProfile().catch(() => null),
          fetchAvailableDoctors().catch(() => []),
          fetchCycleData().catch(() => null),
        ]);

        if (isMounted) {
          setReminders(rems || []);
          setHealthTips(tipsRes?.tips || []);
          setAppointments(appts || []);
          setDoctorsList(docs || []);
          if (cycleRes) {
            setCycleData(cycleRes);
            setCycleSettingsForm({
              lastPeriodStart: cycleRes.lastPeriodStart
                ? new Date(cycleRes.lastPeriodStart).toISOString().split('T')[0]
                : '',
              cycleLength: cycleRes.cycleLength || 28,
              periodDuration: cycleRes.periodDuration || 5,
            });
          }
          if (profile) {
            setUser(profile);
            saveSession(profile);
            setEmergencyContactForm({
              name: profile.emergencyContact?.name || '',
              email: profile.emergencyContact?.email || '',
              phone: profile.emergencyContact?.phone || '',
              relationship: profile.emergencyContact?.relationship || 'Family / Guardian',
            });
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  // --- AI Assistant Submit ---
  function handleAiSubmit(e) {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userMessage = aiQuestion.trim();
    setAiChat((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setAiQuestion('');
    setAiLoading(true);

    setTimeout(() => {
      let botResponse = `Thank you for your question about "${userMessage}". For specific prescription modifications, always consult your physician. In general, ensure you stick to your scheduled timings and drink plenty of water.`;

      const lower = userMessage.toLowerCase();
      if (lower.includes('headache') || lower.includes('pain')) {
        botResponse =
          'For mild headaches or tension, ensure you are well hydrated, rest in a quiet room, and check if you are due for any prescribed analgesics. Seek immediate medical attention if headache is sudden and unusually severe.';
      } else if (lower.includes('miss') || lower.includes('forgot')) {
        botResponse =
          'If you miss a dose, take it as soon as you remember unless it is almost time for your next scheduled dose. Never take a double dose to make up for a missed one.';
      } else if (lower.includes('side effect')) {
        botResponse =
          'Common medication side effects can include mild nausea, drowsiness, or dry mouth. If you experience rash, swelling, or breathing difficulty, contact emergency services right away.';
      }

      setAiChat((prev) => [...prev, { sender: 'assistant', text: botResponse }]);
      setAiLoading(false);
    }, 900);
  }

  // --- Emergency Handlers ---
  async function handleSaveEmergencyContact(e) {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await updateEmergencyContact(emergencyContactForm);
      setUser((prev) => ({ ...prev, emergencyContact: res.emergencyContact }));
      setActiveModal(null);
      setAlertFeedback({ text: '✅ Emergency contact saved successfully.', isError: false });
    } catch (err) {
      alert(err.message || 'Failed to update emergency contact.');
    } finally {
      setSavingContact(false);
    }
  }

  async function handleDispatchEmergencyAlert(e) {
    e.preventDefault();
    if (!emergencyConfirmed) {
      alert('Please confirm the verification checkbox to dispatch the urgent alert.');
      return;
    }

    setSendingAlert(true);
    try {
      const res = await sendEmergencyAlert({
        emergencyType: emergencySituation,
        note: emergencyNote,
      });
      setActiveModal(null);
      setAlertFeedback({ text: res.message, isError: false });
      setEmergencyNote('');
      setEmergencyConfirmed(false);
    } catch (err) {
      alert(err.message || 'Failed to dispatch emergency alert.');
    } finally {
      setSendingAlert(false);
    }
  }

  // --- Appointment Handlers ---
  async function handleBookAppointment(e) {
    e.preventDefault();
    if (!apptForm.date || !apptForm.reason) {
      alert('Please select an appointment date and provide a reason.');
      return;
    }

    setBookingAppt(true);
    try {
      await bookAppointment(apptForm);
      const updated = await fetchPatientAppointments();
      setAppointments(updated || []);
      setActiveModal(null);
      setApptForm({
        doctorId: '',
        doctorName: 'Dr. Sarah Jenkins, MD',
        doctorSpecialty: 'General Practice',
        date: '',
        time: '10:00',
        reason: '',
        type: 'consultation',
      });
      setAlertFeedback({ text: '✨ Consultation appointment booked successfully.', isError: false });
    } catch (err) {
      alert(err.message || 'Failed to book appointment.');
    } finally {
      setBookingAppt(false);
    }
  }

  async function handleCancelAppt(id) {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      const updated = await fetchPatientAppointments();
      setAppointments(updated || []);
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  }

  // --- Cycle Tracker Handlers ---
  const CYCLE_SYMPTOMS_LIST = [
    'Cramps',
    'Bloating',
    'Fatigue',
    'Mood Swings',
    'Headache',
    'Backache',
    'Tender Breasts',
    'Acne',
    'Cravings',
    'Insomnia',
  ];

  const CYCLE_FLOW_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'spotting', label: 'Spotting 💧' },
    { value: 'light', label: 'Light 🩸' },
    { value: 'medium', label: 'Medium 🩸🩸' },
    { value: 'heavy', label: 'Heavy 🩸🩸🩸' },
  ];

  function toggleCycleSymptom(sym) {
    setCycleLogForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(sym)
        ? prev.symptoms.filter((s) => s !== sym)
        : [...prev.symptoms, sym],
    }));
  }

  async function handleSaveCycleSettings(e) {
    e.preventDefault();
    setSavingCycle(true);
    try {
      const updated = await updateCycleSettings(cycleSettingsForm);
      setCycleData(updated);
      setAlertFeedback({ text: '🌸 Menstruation cycle settings saved.', isError: false });
      setCycleTab('insights');
    } catch (err) {
      alert(err.message || 'Failed to update cycle settings.');
    } finally {
      setSavingCycle(false);
    }
  }

  async function handleSaveDailyCycleLog(e) {
    e.preventDefault();
    setSavingCycle(true);
    try {
      const updated = await logDailyCycleSymptom(cycleLogForm);
      setCycleData(updated);
      setAlertFeedback({ text: '🌸 Daily symptom log recorded successfully.', isError: false });
      setCycleTab('insights');
    } catch (err) {
      alert(err.message || 'Failed to record cycle symptom.');
    } finally {
      setSavingCycle(false);
    }
  }

  async function handleDownloadHealthProfilePDF() {
    setDownloadingProfilePdf(true);
    try {
      await downloadComprehensiveHealthProfilePDF(user?.name || 'Patient');
      setAlertFeedback({
        text: '📄 Comprehensive Patient Health Profile PDF generated and downloaded.',
        isError: false,
      });
    } catch (err) {
      alert(err.message || 'Failed to download health profile PDF.');
    } finally {
      setDownloadingProfilePdf(false);
    }
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const takenCount = reminders.filter((r) => r.status === 'taken').length;
  const nextReminder = reminders.find((r) => r.status === 'scheduled');
  const upcomingAppt = appointments.find((a) => a.status === 'scheduled');

  return (
    <div className="dash-page">
      {/* Navigation Top Bar */}
      <header className="dash-nav">
        <div className="dash-nav-container">
          <div className="dash-brand">
            <span className="dash-brand-icon">💊</span>
            <span className="dash-brand-title">MediConnect</span>
          </div>

          <div className="dash-nav-user">
            <div className="dash-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.name || 'Patient'}</span>
              <span className="dash-user-email">{user?.email || ''}</span>
            </div>
            <button className="dash-logout-btn" onClick={handleLogout} title="Log out">
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="dash-shell">
        {/* Feedback Banner */}
        {alertFeedback.text && (
          <div
            className={`dash-feedback-banner ${alertFeedback.isError ? 'banner-error' : 'banner-success'}`}
          >
            <span>{alertFeedback.text}</span>
            <button
              className="dash-banner-close"
              onClick={() => setAlertFeedback({ text: '', isError: false })}
            >
              ✕
            </button>
          </div>
        )}

        {/* Emergency Quick Access Bar */}
        <section className="dash-emergency-bar">
          <div className="dash-em-left">
            <span className="dash-em-badge">🚨 Emergency Contact Quick Access</span>
            <div className="dash-em-details">
              {user?.emergencyContact?.name ? (
                <span>
                  <strong>Guardian:</strong> {user.emergencyContact.name} (
                  {user.emergencyContact.relationship || 'Contact'}) •{' '}
                  <span className="dash-em-email">{user.emergencyContact.email}</span>
                </span>
              ) : (
                <span style={{ color: '#DC2626' }}>
                  ⚠️ No emergency contact registered. Please configure a trusted contact.
                </span>
              )}
            </div>
          </div>

          <div className="dash-em-actions">
            <button
              className="dash-btn-em-settings"
              onClick={() => setActiveModal('emergency_settings')}
            >
              ⚙️ Contact Settings
            </button>
            <button
              className="dash-btn-em-alert"
              onClick={() => {
                if (!user?.emergencyContact?.email) {
                  alert('Please configure an emergency contact email first.');
                  setActiveModal('emergency_settings');
                } else {
                  setActiveModal('emergency_alert');
                }
              }}
            >
              🚨 Send Emergency Alert
            </button>
          </div>
        </section>

        {/* Hero Welcome Banner */}
        <section className="dash-hero">
          <div className="dash-hero-content">
            <p className="dash-hero-date">{todayStr}</p>
            <h1>Welcome back, {user?.name ? user.name.split(' ')[0] : 'there'}! 👋</h1>
            <p className="dash-hero-subtitle">
              Here is an overview of your health dashboard, upcoming medication schedule, mental well-being tools, and personalized recommendations.
            </p>
          </div>

          <div className="dash-hero-stats">
            <div className="dash-stat-pill">
              <span className="dash-stat-num">{scheduledCount}</span>
              <span className="dash-stat-label">Pending Doses</span>
            </div>
            <div className="dash-stat-pill">
              <span className="dash-stat-num">{takenCount}</span>
              <span className="dash-stat-label">Taken Today</span>
            </div>
            <div className="dash-stat-pill">
              <span className="dash-stat-num">{appointments.filter((a) => a.status === 'scheduled').length}</span>
              <span className="dash-stat-label">Appointments</span>
            </div>
          </div>
        </section>

        {/* Quick Alerts Strip (Next Dose + Next Appointment) */}
        <div className="dash-alerts-strip">
          {nextReminder && (
            <div className="dash-next-alert" onClick={() => navigate('/reminders')}>
              <div className="dash-alert-left">
                <span className="dash-alert-badge">⏰ Next Dose Due</span>
                <div>
                  <strong>{nextReminder.name}</strong> • {nextReminder.dosage} at {nextReminder.time}
                </div>
              </div>
              <span className="dash-alert-link">Open Reminders →</span>
            </div>
          )}

          {upcomingAppt && (
            <div className="dash-next-alert appt-alert" onClick={() => setActiveModal('book_appt')}>
              <div className="dash-alert-left">
                <span className="dash-alert-badge appt-badge">📅 Upcoming Consultation</span>
                <div>
                  <strong>{upcomingAppt.doctorName}</strong> •{' '}
                  {new Date(upcomingAppt.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at {upcomingAppt.time}
                </div>
              </div>
              <span className="dash-alert-link">View Schedule →</span>
            </div>
          )}
        </div>

        {/* Personalized Educational Health Tips Highlight Strip */}
        {healthTips.length > 0 && (
          <section className="dash-tips-strip">
            <div className="dash-tips-header">
              <div className="dash-tips-title-wrap">
                <span className="dash-tips-badge">💡 Personalized For You</span>
                <h3>Educational Health Recommendations</h3>
              </div>
              <button className="dash-tips-view-all-btn" onClick={() => setActiveModal('tips')}>
                View All {healthTips.length} Tips →
              </button>
            </div>

            <div className="dash-tips-preview-grid">
              {healthTips.slice(0, 3).map((tip) => (
                <div key={tip.id} className="dash-tip-preview-card" onClick={() => setActiveModal('tips')}>
                  <div className="dash-tip-card-top">
                    <span className="dash-tip-icon">{tip.icon}</span>
                    <span className="dash-tip-tag">{tip.tag}</span>
                  </div>
                  <h4>{tip.title}</h4>
                  <p>{tip.content}</p>
                </div>
              ))}
            </div>
            <p className="dash-disclaimer-sub">
              ℹ️ Educational information only. Not a substitute for professional medical advice or clinical diagnosis.
            </p>
          </section>
        )}

        {/* Core Modules Grid */}
        <section className="dash-grid">
          {/* Card 1: Medicine Reminders */}
          <div
            className="dash-card dash-card-primary"
            onClick={() => navigate('/reminders')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box primary">💊</div>
              <span className="dash-chip active">Active Schedule</span>
            </div>
            <h3>Medicine Reminders</h3>
            <p>
              View your personalized medication timeline, log doses (Taken, Skipped, Snoozed), and configure automated email notifications.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta">
                Manage Schedule ({reminders.length} total) →
              </span>
            </div>
          </div>

          {/* Card 2: Mental Well-being & Mood Tracker */}
          <div
            className="dash-card"
            onClick={() => navigate('/mental-wellbeing')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box records">🧠</div>
              <span className="dash-chip records">Mood & Screenings</span>
            </div>
            <h3>Mental Well-being</h3>
            <p>
              Log daily mood check-ins, view emotional trend trajectories, and take self-awareness screenings for Depression, Anxiety, and OCD.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta">Open Well-being Hub →</span>
            </div>
          </div>

          {/* Card 3: Doctor Appointments */}
          <div
            className="dash-card"
            onClick={() => setActiveModal('book_appt')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box appts">📅</div>
              <span className="dash-chip appts">Clinical Care</span>
            </div>
            <h3>Doctor Appointments</h3>
            <p>
              Schedule in-person or virtual consultations with registered MediConnect physicians and review appointment notes.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta">
                Book / View Consultations ({appointments.length}) →
              </span>
            </div>
          </div>

          {/* Card 4: Menstruation Cycle Tracker */}
          <div
            className="dash-card dash-card-cycle"
            onClick={() => setActiveModal('cycle')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box cycle">🌸</div>
              <span className="dash-chip cycle">
                {cycleData?.phase ? cycleData.phase : 'Cycle Tracking'}
              </span>
            </div>
            <h3>Menstruation Cycle Tracker</h3>
            <p>
              {cycleData?.phase
                ? `Currently in ${cycleData.phase} (Day ${cycleData.currentCycleDay} of ${cycleData.cycleLength}). Next period expected in ~${cycleData.daysUntilNext} day(s).`
                : 'Track your period cycle phases, log daily symptoms, predict fertile windows, and access phase-specific wellness guidance.'}
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta">Open Cycle Tracker →</span>
            </div>
          </div>

          {/* Card 5: PCOS Tracker & Pattern Screening */}
          <div
            className="dash-card"
            onClick={() => navigate('/pcos')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box" style={{ background: '#FBE7EE', color: '#A8305C' }}>🔬</div>
              <span className="dash-chip" style={{ background: '#FBE7EE', color: '#A8305C' }}>PCOS Screening</span>
            </div>
            <h3>PCOS Tracker & Pattern Check</h3>
            <p>
              Screen for PCOS risk patterns (acne, excess hair growth, hair thinning, weight changes) and track hormonal signs with algorithmic clinical indicators.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta" style={{ color: '#A8305C' }}>Open PCOS Screening Hub →</span>
            </div>
          </div>

          {/* Card 6: Clinical Reports & Doctor Diagnoses */}
          <div
            className="dash-card"
            onClick={() => navigate('/reports/generate')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box" style={{ background: '#E4EFEC', color: '#146356' }}>📄</div>
              <span className="dash-chip" style={{ background: '#E4EFEC', color: '#146356' }}>Clinical Reports</span>
            </div>
            <h3>Health Reports & Diagnoses</h3>
            <p>
              Generate structured symptom health reports, download clinical PDF records, share reports with physicians, and view doctor diagnoses.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta" style={{ color: '#146356' }}>Generate / View Reports →</span>
            </div>
          </div>

          {/* Card 7: AI Health Assistant */}
          <div
            className="dash-card"
            onClick={() => setActiveModal('ai')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box ai">🤖</div>
              <span className="dash-chip feature">AI Assistant</span>
            </div>
            <h3>AI Health Assistant</h3>
            <p>
              Have questions about dosage instructions, possible side effects, or dietary precautions? Ask your interactive assistant anytime.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta">Ask AI Assistant →</span>
            </div>
          </div>

          {/* Card 8: Health Profile & Records */}
          <div
            className="dash-card"
            onClick={() => setActiveModal('profile')}
            role="button"
            tabIndex={0}
          >
            <div className="dash-card-header">
              <div className="dash-icon-box records">📊</div>
              <span className="dash-chip records">My Vitals</span>
            </div>
            <h3>Health Profile & Records</h3>
            <p>
              Review your registered patient profile, stored medical history, vitals, and emergency contact details.
            </p>
            <div className="dash-card-footer">
              <span className="dash-card-cta">View Profile & Vitals →</span>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== EMERGENCY ALERT CONFIRMATION MODAL ==================== */}
      {activeModal === 'emergency_alert' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card em-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ borderBottom: '2px solid #F87171' }}>
              <div className="dash-em-modal-title">
                <span style={{ fontSize: '1.8rem' }}>🚨</span>
                <div>
                  <h3 style={{ color: '#DC2626', margin: 0 }}>Send Emergency Medical Alert</h3>
                  <span style={{ fontSize: '0.8rem', color: '#5B6B65' }}>
                    Rapid communication notification to your registered guardian
                  </span>
                </div>
              </div>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchEmergencyAlert} style={{ marginTop: '1.2rem' }}>
              <div className="dash-em-alert-recipient">
                <strong>Recipient:</strong> {user?.emergencyContact?.name} ({user?.emergencyContact?.email})
              </div>

              <div className="dash-form-field" style={{ marginTop: '1rem' }}>
                <label htmlFor={emSitId}><strong>1. Select Emergency Situation:</strong></label>
                <select
                  id={emSitId}
                  className="dash-input"
                  value={emergencySituation}
                  onChange={(e) => setEmergencySituation(e.target.value)}
                  required
                >
                  {EMERGENCY_SITUATIONS.map((sit) => (
                    <option key={sit.id} value={sit.label}>
                      {sit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dash-form-field" style={{ marginTop: '1rem' }}>
                <label htmlFor={emNotesId}><strong>2. Additional Note or Current Location (Optional):</strong></label>
                <input
                  id={emNotesId}
                  type="text"
                  className="dash-input"
                  placeholder="e.g. Living room, experiencing sudden pain, please call 911"
                  value={emergencyNote}
                  onChange={(e) => setEmergencyNote(e.target.value)}
                />
              </div>

              {/* Safety Confirmation */}
              <div className="dash-em-confirm-box">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emergencyConfirmed}
                    onChange={(e) => setEmergencyConfirmed(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#991B1B' }}>
                    <strong>Confirmation:</strong> I confirm that I want to dispatch an immediate high-priority emergency notification email to my guardian.
                  </span>
                </label>
              </div>

              <div className="dash-disclaimer-box" style={{ marginTop: '1rem' }}>
                <strong>Important Medical Safety Notice:</strong> This feature is a communication aid and does not automatically diagnose heart attacks or medical emergencies. In an immediate life-threatening emergency, please dial <strong>911 (or local emergency services)</strong> directly.
              </div>

              <div className="dash-modal-actions" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="dash-btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-em-dispatch"
                  disabled={sendingAlert || !emergencyConfirmed}
                >
                  {sendingAlert ? 'Dispatching Alert…' : '🚨 Yes, Send Urgent Alert Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EMERGENCY CONTACT SETTINGS MODAL ==================== */}
      {activeModal === 'emergency_settings' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3>⚙️ Emergency Contact Configuration</h3>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmergencyContact} style={{ marginTop: '1.2rem' }}>
              <p style={{ fontSize: '0.88rem', color: '#5B6B65', margin: '0 0 1.25rem' }}>
                Save a trusted family member, guardian, or caregiver to receive one-click emergency medical notifications.
              </p>

              <div className="dash-form-field">
                <label htmlFor={emNameId}>Guardian / Contact Name</label>
                <input
                  id={emNameId}
                  type="text"
                  className="dash-input"
                  placeholder="e.g. Jane Doe"
                  value={emergencyContactForm.name}
                  onChange={(e) =>
                    setEmergencyContactForm({ ...emergencyContactForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="dash-form-field" style={{ marginTop: '0.85rem' }}>
                <label htmlFor={emEmailId}>Guardian Email Address (Receives Alerts)</label>
                <input
                  id={emEmailId}
                  type="email"
                  className="dash-input"
                  placeholder="guardian@example.com"
                  value={emergencyContactForm.email}
                  onChange={(e) =>
                    setEmergencyContactForm({ ...emergencyContactForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="dash-form-field" style={{ marginTop: '0.85rem' }}>
                <label htmlFor={emPhoneId}>Phone Number (Optional)</label>
                <input
                  id={emPhoneId}
                  type="tel"
                  className="dash-input"
                  placeholder="+1 (555) 019-2834"
                  value={emergencyContactForm.phone}
                  onChange={(e) =>
                    setEmergencyContactForm({ ...emergencyContactForm, phone: e.target.value })
                  }
                />
              </div>

              <div className="dash-form-field" style={{ marginTop: '0.85rem' }}>
                <label htmlFor={emRelId}>Relationship</label>
                <input
                  id={emRelId}
                  type="text"
                  className="dash-input"
                  placeholder="e.g. Spouse, Parent, Sibling, Caregiver"
                  value={emergencyContactForm.relationship}
                  onChange={(e) =>
                    setEmergencyContactForm({ ...emergencyContactForm, relationship: e.target.value })
                  }
                />
              </div>

              <div className="dash-modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="dash-btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="dash-btn-primary" disabled={savingContact}>
                  {savingContact ? 'Saving…' : 'Save Emergency Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== APPOINTMENTS MODAL ==================== */}
      {activeModal === 'book_appt' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div>
                <span className="dash-card-eyebrow">Clinical Consultations</span>
                <h3>Doctor Appointments & Schedule</h3>
              </div>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              {/* Existing Appointments */}
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Scheduled Consultations ({appointments.length})</h4>
              {appointments.length === 0 ? (
                <p style={{ fontSize: '0.88rem', color: '#5B6B65' }}>No appointments booked yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {appointments.map((appt) => (
                    <div
                      key={appt._id}
                      style={{
                        background: '#F8FAFA',
                        border: '1px solid #E7ECEA',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{appt.doctorName}</strong> ({appt.doctorSpecialty})
                        <div style={{ fontSize: '0.8rem', color: '#5B6B65' }}>
                          📅 {new Date(appt.date).toLocaleDateString()} at {appt.time} • Mode: {appt.type}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#1F2937' }}>Reason: {appt.reason}</div>
                        {appt.clinicalNotes && (
                          <div style={{ fontSize: '0.78rem', color: '#0F5132', marginTop: '0.2rem' }}>
                            Doctor Note: {appt.clinicalNotes}
                          </div>
                        )}
                      </div>
                      <div>
                        {appt.status === 'scheduled' && (
                          <button
                            className="dash-btn-sm-cancel"
                            onClick={() => handleCancelAppt(appt._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Book New Consultation Form */}
              <form onSubmit={handleBookAppointment} style={{ borderTop: '1px solid #E7ECEA', paddingTop: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.85rem', fontSize: '1rem' }}>+ Book a New Consultation</h4>

                <div className="dash-form-row">
                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label htmlFor={apptDoctorId}>Select Doctor / Specialty</label>
                    <select
                      id={apptDoctorId}
                      className="dash-input"
                      value={apptForm.doctorId}
                      onChange={(e) => {
                        const selectedDoc = doctorsList.find((d) => d._id === e.target.value);
                        setApptForm({
                          ...apptForm,
                          doctorId: e.target.value,
                          doctorName: selectedDoc ? selectedDoc.name : 'Dr. Sarah Jenkins, MD',
                          doctorSpecialty: selectedDoc?.specialization || 'General Practice',
                        });
                      }}
                    >
                      <option value="">General Practice (Default)</option>
                      {doctorsList.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.name} — {doc.specialization || 'General Practice'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label htmlFor={apptTypeId}>Consultation Mode</label>
                    <select
                      id={apptTypeId}
                      className="dash-input"
                      value={apptForm.type}
                      onChange={(e) => setApptForm({ ...apptForm, type: e.target.value })}
                    >
                      <option value="consultation">Virtual Video Consultation</option>
                      <option value="in-person">In-Person Clinic Visit</option>
                    </select>
                  </div>
                </div>

                <div className="dash-form-row" style={{ marginTop: '0.85rem' }}>
                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label htmlFor={apptDateId}>Date</label>
                    <input
                      id={apptDateId}
                      type="date"
                      className="dash-input"
                      value={apptForm.date}
                      onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label htmlFor={apptTimeId}>Preferred Time</label>
                    <input
                      id={apptTimeId}
                      type="time"
                      className="dash-input"
                      value={apptForm.time}
                      onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="dash-form-field" style={{ marginTop: '0.85rem' }}>
                  <label htmlFor={apptReasonId}>Reason for Consultation / Symptoms</label>
                  <input
                    id={apptReasonId}
                    type="text"
                    className="dash-input"
                    placeholder="e.g. Follow-up on blood pressure and prescription review"
                    value={apptForm.reason}
                    onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
                    required
                  />
                </div>

                <div className="dash-modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="dash-btn-secondary"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                  <button type="submit" className="dash-btn-primary" disabled={bookingAppt}>
                    {bookingAppt ? 'Booking…' : 'Confirm Consultation Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PERSONALIZED HEALTH TIPS MODAL ==================== */}
      {activeModal === 'tips' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div>
                <span className="dash-card-eyebrow">Personalized Health Intelligence</span>
                <h3>Educational Health Tips</h3>
              </div>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <div className="dash-modal-tips-list">
              {healthTips.map((tip) => (
                <div key={tip.id} className="dash-tip-full-card">
                  <div className="dash-tip-header-row">
                    <span className="dash-tip-icon">{tip.icon}</span>
                    <div>
                      <span className="dash-tip-tag">{tip.tag}</span>
                      <h4>{tip.title}</h4>
                    </div>
                  </div>
                  <p>{tip.content}</p>
                </div>
              ))}
            </div>

            <div className="dash-disclaimer-box" style={{ marginTop: '1.25rem' }}>
              <strong>Educational Disclaimer:</strong> This information is prepared for self-awareness and general wellness education. It does not replace clinical judgment or medical prescriptions. Consult your healthcare provider for specialized medical care.
            </div>

            <div className="dash-modal-actions" style={{ marginTop: '1.25rem' }}>
              <button className="dash-btn-primary" onClick={() => setActiveModal(null)}>
                Close Tips
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AI ASSISTANT MODAL ==================== */}
      {activeModal === 'ai' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>🤖</span>
                <div>
                  <h3 style={{ margin: 0 }}>AI Health Assistant</h3>
                  <span style={{ fontSize: '0.78rem', color: '#5B6B65' }}>
                    Interactive Medication & Wellness Guidance
                  </span>
                </div>
              </div>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <div className="dash-chat-window">
              {aiChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`dash-chat-bubble ${msg.sender === 'user' ? 'chat-user' : 'chat-bot'}`}
                >
                  {msg.text}
                </div>
              ))}
              {aiLoading && (
                <div className="dash-chat-bubble chat-bot">
                  <em>AI Assistant is typing…</em>
                </div>
              )}
            </div>

            <form onSubmit={handleAiSubmit} className="dash-chat-input-row">
              <input
                type="text"
                placeholder="Ask about side effects, timing, or nutrition…"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className="dash-input"
              />
              <button type="submit" className="dash-btn-primary" disabled={aiLoading || !aiQuestion.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== HEALTH PROFILE & VITALS MODAL ==================== */}
      {activeModal === 'profile' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>📊</span>
                <div>
                  <h3 style={{ margin: 0 }}>Patient Health Profile & Records</h3>
                  <span style={{ fontSize: '0.78rem', color: '#5B6B65' }}>
                    Comprehensive demographics, vitals, prescriptions, and clinical history
                  </span>
                </div>
              </div>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <div className="dash-profile-body" style={{ marginTop: '1rem' }}>
              {/* PDF & Printable Action Strip */}
              <div className="dash-profile-pdf-strip">
                <div className="dash-pdf-strip-info">
                  <strong style={{ color: '#0F4E44', fontSize: '0.95rem' }}>📄 Official Printable PDF Record</strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#374151' }}>
                    Export all patient data (vitals, medications, mood screenings, cycle tracking, appointments & doctor diagnoses) into a clean, printable clinical PDF report.
                  </p>
                </div>
                <div className="dash-pdf-strip-buttons">
                  <button
                    type="button"
                    className="dash-btn-pdf-download"
                    onClick={handleDownloadHealthProfilePDF}
                    disabled={downloadingProfilePdf}
                  >
                    {downloadingProfilePdf ? 'Generating PDF…' : '📥 Download Printable PDF'}
                  </button>
                </div>
              </div>

              <div className="dash-profile-grid" style={{ marginTop: '1.25rem' }}>
                <div>
                  <strong>Full Name:</strong> {user?.name || '—'}
                </div>
                <div>
                  <strong>Email:</strong> {user?.email || '—'}
                </div>
                <div>
                  <strong>Age:</strong> {user?.age || '—'} years
                </div>
                <div>
                  <strong>Gender:</strong> {user?.gender || '—'}
                </div>
                <div>
                  <strong>Height:</strong> {user?.height ? `${user.height} cm` : '—'}
                </div>
                <div>
                  <strong>Weight:</strong> {user?.weight ? `${user.weight} kg` : '—'}
                </div>
                <div>
                  <strong>Calculated BMI:</strong>{' '}
                  {user?.height && user?.weight && user.height > 0
                    ? `${(user.weight / ((user.height / 100) * (user.height / 100))).toFixed(1)} kg/m²`
                    : '—'}
                </div>
                <div>
                  <strong>Active Prescriptions:</strong> {reminders.length} registered
                </div>
              </div>

              {user?.medicalHistory && (
                <div style={{ marginTop: '1rem', background: '#F8FAFA', padding: '0.85rem', borderRadius: '10px' }}>
                  <strong>Medical History / Diagnoses:</strong>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#5B6B65' }}>
                    {user.medicalHistory}
                  </p>
                </div>
              )}

              <div style={{ marginTop: '1rem', background: '#FEF2F2', padding: '0.85rem', borderRadius: '10px' }}>
                <strong style={{ color: '#991B1B' }}>🚨 Registered Emergency Contact:</strong>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#374151' }}>
                  {user?.emergencyContact?.name
                    ? `${user.emergencyContact.name} (${user.emergencyContact.relationship || 'Guardian'}) • ${user.emergencyContact.email} • ${user.emergencyContact.phone || 'No phone'}`
                    : 'No emergency contact registered yet.'}
                </p>
              </div>

              <div className="dash-modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="dash-btn-pdf-download"
                  onClick={handleDownloadHealthProfilePDF}
                  disabled={downloadingProfilePdf}
                  style={{ marginRight: 'auto' }}
                >
                  {downloadingProfilePdf ? 'Generating PDF…' : '📄 Export Printable PDF'}
                </button>
                <button
                  className="dash-btn-secondary"
                  onClick={() => {
                    setActiveModal('emergency_settings');
                  }}
                >
                  Edit Emergency Contact
                </button>
                <button className="dash-btn-primary" onClick={() => setActiveModal(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MENSTRUATION CYCLE TRACKER MODAL ==================== */}
      {activeModal === 'cycle' && (
        <div className="dash-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="dash-modal-card cycle-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ borderBottom: '2px solid #FDA4AF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🌸</span>
                <div>
                  <h3 style={{ margin: 0, color: '#BE123C' }}>Menstruation Cycle Tracker</h3>
                  <span style={{ fontSize: '0.78rem', color: '#5B6B65' }}>
                    Phase intelligence, symptom logging, and period forecasting
                  </span>
                </div>
              </div>
              <button className="dash-modal-close" onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            {/* Cycle Status Hero Card */}
            <div className="dash-cycle-hero">
              <div className="dash-cycle-hero-left">
                <span className="dash-cycle-phase-tag">
                  {cycleData?.phaseEmoji || '🌸'} {cycleData?.phase || 'Cycle Overview'}
                </span>
                <h4 className="dash-cycle-day-count">
                  Day {cycleData?.currentCycleDay || 1}{' '}
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#9F1239' }}>
                    of {cycleData?.cycleLength || 28}
                  </span>
                </h4>
                <p className="dash-cycle-forecast">
                  Next period in <strong>~{cycleData?.daysUntilNext ?? 14} day(s)</strong> (
                  {cycleData?.nextPeriodDate
                    ? new Date(cycleData.nextPeriodDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                  )
                </p>
              </div>

              <div className="dash-cycle-dial">
                <span className="dash-dial-val">{cycleData?.currentCycleDay || 1}</span>
                <span className="dash-dial-sub">CURRENT DAY</span>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="dash-cycle-tabs">
              <button
                type="button"
                className={`dash-cycle-tab-btn ${cycleTab === 'insights' ? 'active' : ''}`}
                onClick={() => setCycleTab('insights')}
              >
                🌟 Phase Guidance
              </button>
              <button
                type="button"
                className={`dash-cycle-tab-btn ${cycleTab === 'log' ? 'active' : ''}`}
                onClick={() => setCycleTab('log')}
              >
                📝 Daily Symptom Log
              </button>
              <button
                type="button"
                className={`dash-cycle-tab-btn ${cycleTab === 'settings' ? 'active' : ''}`}
                onClick={() => setCycleTab('settings')}
              >
                ⚙️ Cycle Settings
              </button>
              <button
                type="button"
                className={`dash-cycle-tab-btn ${cycleTab === 'history' ? 'active' : ''}`}
                onClick={() => setCycleTab('history')}
              >
                📋 History ({cycleData?.dailyLogs?.length || 0})
              </button>
            </div>

            {/* TAB 1: PHASE GUIDANCE */}
            {cycleTab === 'insights' && (
              <div className="dash-cycle-tab-body">
                <div className="dash-cycle-phase-box">
                  <h4>{cycleData?.phaseEmoji} {cycleData?.phase} Insights</h4>
                  <p>{cycleData?.phaseDescription}</p>
                </div>

                <div className="dash-cycle-recs-box">
                  <h4>💡 Phase-Specific Self-Care</h4>
                  <p>{cycleData?.recommendations}</p>
                </div>

                <div className="dash-cycle-milestones-grid">
                  <div className="dash-cycle-milestone">
                    <span className="dash-ms-label">Period Duration</span>
                    <span className="dash-ms-val">{cycleData?.periodDuration || 5} Days</span>
                  </div>
                  <div className="dash-cycle-milestone">
                    <span className="dash-ms-label">Estimated Ovulation</span>
                    <span className="dash-ms-val">Day ~{cycleData?.ovulationDay || 14}</span>
                  </div>
                  <div className="dash-cycle-milestone">
                    <span className="dash-ms-label">Total Cycle Length</span>
                    <span className="dash-ms-val">{cycleData?.cycleLength || 28} Days</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DAILY SYMPTOM LOGGER */}
            {cycleTab === 'log' && (
              <form onSubmit={handleSaveDailyCycleLog} className="dash-cycle-tab-body">
                <div className="dash-form-row">
                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label>Log Date</label>
                    <input
                      type="date"
                      className="dash-input"
                      value={cycleLogForm.date}
                      onChange={(e) => setCycleLogForm({ ...cycleLogForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.85rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    Flow Intensity:
                  </label>
                  <div className="dash-cycle-flow-grid">
                    {CYCLE_FLOW_OPTIONS.map((fl) => (
                      <button
                        key={fl.value}
                        type="button"
                        className={`dash-flow-btn ${cycleLogForm.flow === fl.value ? 'selected' : ''}`}
                        onClick={() => setCycleLogForm({ ...cycleLogForm, flow: fl.value })}
                      >
                        {fl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    Symptoms & Sensations (Select all that apply):
                  </label>
                  <div className="dash-cycle-symptoms-wrap">
                    {CYCLE_SYMPTOMS_LIST.map((sym) => {
                      const isSelected = cycleLogForm.symptoms.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          className={`dash-sym-pill ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleCycleSymptom(sym)}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="dash-form-field" style={{ marginTop: '1rem' }}>
                  <label>Daily Reflection Note (Optional)</label>
                  <input
                    type="text"
                    className="dash-input"
                    placeholder="e.g. Mild cramping in the morning, energy picked up after hydration"
                    value={cycleLogForm.note}
                    onChange={(e) => setCycleLogForm({ ...cycleLogForm, note: e.target.value })}
                    maxLength={500}
                  />
                </div>

                <div className="dash-modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="submit" className="dash-btn-cycle-primary" disabled={savingCycle}>
                    {savingCycle ? 'Recording…' : 'Save Daily Log 🌸'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: CYCLE SETTINGS */}
            {cycleTab === 'settings' && (
              <form onSubmit={handleSaveCycleSettings} className="dash-cycle-tab-body">
                <div className="dash-form-field">
                  <label>Last Period Start Date</label>
                  <input
                    type="date"
                    className="dash-input"
                    value={cycleSettingsForm.lastPeriodStart}
                    onChange={(e) =>
                      setCycleSettingsForm({ ...cycleSettingsForm, lastPeriodStart: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="dash-form-row" style={{ marginTop: '0.85rem' }}>
                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label>Average Cycle Length (Days)</label>
                    <input
                      type="number"
                      className="dash-input"
                      min={20}
                      max={45}
                      value={cycleSettingsForm.cycleLength}
                      onChange={(e) =>
                        setCycleSettingsForm({ ...cycleSettingsForm, cycleLength: e.target.value })
                      }
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#5B6B65' }}>Standard: 28 days</span>
                  </div>

                  <div className="dash-form-field" style={{ flex: 1 }}>
                    <label>Period Duration (Days)</label>
                    <input
                      type="number"
                      className="dash-input"
                      min={2}
                      max={10}
                      value={cycleSettingsForm.periodDuration}
                      onChange={(e) =>
                        setCycleSettingsForm({ ...cycleSettingsForm, periodDuration: e.target.value })
                      }
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#5B6B65' }}>Standard: 5 days</span>
                  </div>
                </div>

                <div className="dash-modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="submit" className="dash-btn-cycle-primary" disabled={savingCycle}>
                    {savingCycle ? 'Updating…' : 'Update Cycle Settings'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: RECENT LOGS */}
            {cycleTab === 'history' && (
              <div className="dash-cycle-tab-body">
                {(!cycleData?.dailyLogs || cycleData.dailyLogs.length === 0) ? (
                  <p style={{ textAlign: 'center', color: '#5B6B65', padding: '2rem 1rem' }}>
                    No symptom entries logged yet. Use the Daily Symptom Log tab to record your first entry!
                  </p>
                ) : (
                  <div className="dash-cycle-history-list">
                    {cycleData.dailyLogs.map((log) => (
                      <div key={log._id} className="dash-cycle-history-item">
                        <div className="dash-cycle-history-left">
                          <span className="dash-cycle-log-date">
                            {new Date(log.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="dash-cycle-log-flow">Flow: {log.flow}</span>
                        </div>
                        <div>
                          {log.symptoms && log.symptoms.length > 0 && (
                            <div className="dash-cycle-log-syms">
                              {log.symptoms.map((s) => (
                                <span key={s} className="dash-sym-chip">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {log.note && <p className="dash-cycle-log-note">“{log.note}”</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="dash-disclaimer-box" style={{ marginTop: '1.25rem' }}>
              <strong>Educational Disclaimer:</strong> Cycle predictions and ovulation windows are algorithmic estimations for personal self-awareness and wellness planning. They should not be used as a primary method of contraception or medical diagnosis.
            </div>

            <div className="dash-modal-actions" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="dash-btn-secondary"
                onClick={() => {
                  setActiveModal(null);
                  navigate('/pcos');
                }}
                style={{ color: '#A8305C', borderColor: '#FDA4AF' }}
              >
                🔬 PCOS Pattern Check
              </button>
              <button
                type="button"
                className="dash-btn-secondary"
                onClick={() => {
                  setActiveModal(null);
                  navigate('/cycles/prediction');
                }}
              >
                🔮 Cycle Predictions
              </button>
              <button
                type="button"
                className="dash-btn-secondary"
                onClick={() => {
                  setActiveModal(null);
                  navigate('/cycles');
                }}
              >
                📜 Full Cycle History
              </button>
              <button className="dash-btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
