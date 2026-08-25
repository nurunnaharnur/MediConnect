import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../api/authApi';
import {
  fetchDoctorPatients,
  fetchPatientFullRecord,
  fetchDoctorAppointments,
  updateDoctorAppointment,
} from '../api/doctorApi';
import '../styles/DoctorDashboard.css';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getUser());
  const [activeTab, setActiveTab] = useState('patients'); // 'patients', 'appointments'

  // Data States
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Patient Detailed View Modal
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // Appointment Clinical Note State
  const [editingApptId, setEditingApptId] = useState(null);
  const [clinicalNoteText, setClinicalNoteText] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [patientsData, apptsData] = await Promise.all([
          fetchDoctorPatients(),
          fetchDoctorAppointments(),
        ]);
        if (isMounted) {
          setPatients(patientsData || []);
          setAppointments(apptsData || []);
        }
      } catch (err) {
        console.error('Error loading doctor dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  async function openPatientRecord(patientId) {
    setSelectedPatientId(patientId);
    setLoadingRecord(true);
    try {
      const data = await fetchPatientFullRecord(patientId);
      setPatientRecord(data);
    } catch (err) {
      alert(err.message || 'Failed to load patient health record.');
      setSelectedPatientId(null);
    } finally {
      setLoadingRecord(false);
    }
  }

  function closePatientRecord() {
    setSelectedPatientId(null);
    setPatientRecord(null);
  }

  async function handleUpdateAppointmentStatus(apptId, newStatus) {
    try {
      await updateDoctorAppointment(apptId, { status: newStatus });
      const updatedAppts = await fetchDoctorAppointments();
      setAppointments(updatedAppts);
    } catch (err) {
      alert(err.message || 'Failed to update appointment status.');
    }
  }

  async function handleSaveClinicalNote(apptId) {
    setSavingAppt(true);
    try {
      await updateDoctorAppointment(apptId, { clinicalNotes: clinicalNoteText });
      const updatedAppts = await fetchDoctorAppointments();
      setAppointments(updatedAppts);
      setEditingApptId(null);
      setClinicalNoteText('');
    } catch (err) {
      alert(err.message || 'Failed to save clinical note.');
    } finally {
      setSavingAppt(false);
    }
  }

  // Filter patients by search query
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.medicalHistory?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="doc-page">
      <div className="doc-shell">
        {/* Top Clinical Header */}
        <header className="doc-nav-bar">
          <div className="doc-brand">
            <span className="doc-brand-icon">🩺</span>
            <div>
              <span className="doc-brand-title">MediConnect Clinical Portal</span>
              <span className="doc-provider-badge">
                {user?.specialization || 'Healthcare Provider'}
              </span>
            </div>
          </div>

          <div className="doc-nav-user">
            <div className="doc-user-info">
              <span className="doc-user-name">{user?.name || 'Dr. Physician'}</span>
              <span className="doc-license-tag">
                {user?.licenseNumber ? `License: ${user.licenseNumber}` : user?.email}
              </span>
            </div>
            <button
              className="doc-logout-btn"
              onClick={() => {
                clearSession();
                navigate('/doctor-login');
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Hero Clinical Overview */}
        <section className="doc-hero">
          <div className="doc-hero-content">
            <span className="doc-hero-badge">Clinical Dashboard</span>
            <h1>Welcome, {user?.name || 'Doctor'}</h1>
            <p>
              Monitor your patient panel, review real-time medication adherence, assess mood and screening trajectories, and manage upcoming consultations.
            </p>
          </div>

          <div className="doc-hero-stats">
            <div className="doc-stat-card">
              <span className="doc-stat-val">{patients.length}</span>
              <span className="doc-stat-label">Active Patients</span>
            </div>
            <div className="doc-stat-card">
              <span className="doc-stat-val">
                {appointments.filter((a) => a.status === 'scheduled').length}
              </span>
              <span className="doc-stat-label">Pending Appointments</span>
            </div>
            <div
              className="doc-stat-card"
              style={{ cursor: 'pointer', background: '#E4EFEC', borderColor: '#146356' }}
              onClick={() => navigate('/doctor/reports')}
              role="button"
              tabIndex={0}
            >
              <span className="doc-stat-val" style={{ color: '#146356' }}>📋 View</span>
              <span className="doc-stat-label" style={{ color: '#0F4E44', fontWeight: 600 }}>
                Shared Health Reports →
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="doc-tabs">
          <button
            className={`doc-tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            👥 Patient Roster & Records ({patients.length})
          </button>
          <button
            className={`doc-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            📅 Consultations & Appointments ({appointments.length})
          </button>
        </nav>

        {/* ==================== TAB 1: PATIENTS ROSTER ==================== */}
        {activeTab === 'patients' && (
          <div className="doc-tab-content">
            <div className="doc-card">
              <div className="doc-card-header">
                <div>
                  <span className="doc-card-eyebrow">Patient Management</span>
                  <h2>Patient Panel Overview</h2>
                </div>

                <div className="doc-search-box">
                  <input
                    type="text"
                    placeholder="Search by name, email, or diagnosis…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: '#5B6B65' }}>
                  Loading patient panel…
                </p>
              ) : filteredPatients.length === 0 ? (
                <div className="doc-empty-state">
                  <p>No matching patients found.</p>
                  <span>Patients registered in MediConnect will appear in this roster.</span>
                </div>
              ) : (
                <div className="doc-patients-grid">
                  {filteredPatients.map((pt) => {
                    const moodEmoji =
                      pt.latestMood?.mood === 'very_happy'
                        ? '😄'
                        : pt.latestMood?.mood === 'happy'
                        ? '🙂'
                        : pt.latestMood?.mood === 'calm'
                        ? '😌'
                        : pt.latestMood?.mood === 'neutral'
                        ? '😐'
                        : pt.latestMood?.mood === 'stressed'
                        ? '😫'
                        : pt.latestMood?.mood === 'anxious'
                        ? '😰'
                        : pt.latestMood?.mood === 'sad'
                        ? '😢'
                        : pt.latestMood?.mood === 'very_sad'
                        ? '😭'
                        : pt.latestMood?.mood === 'angry'
                        ? '😡'
                        : '—';

                    return (
                      <div key={pt._id} className="doc-patient-card">
                        <div className="doc-pt-header">
                          <div>
                            <h3>{pt.name}</h3>
                            <span className="doc-pt-email">{pt.email}</span>
                          </div>
                          {pt.bmi && (
                            <span
                              className={`doc-bmi-badge ${
                                pt.bmi >= 25 ? 'bmi-warn' : pt.bmi < 18.5 ? 'bmi-warn' : 'bmi-normal'
                              }`}
                            >
                              BMI {pt.bmi}
                            </span>
                          )}
                        </div>

                        <div className="doc-pt-vitals-row">
                          <span>
                            <strong>Age:</strong> {pt.age || '—'}
                          </span>
                          <span>
                            <strong>Sex:</strong> {pt.gender || '—'}
                          </span>
                          <span>
                            <strong>Height:</strong> {pt.height ? `${pt.height}cm` : '—'}
                          </span>
                          <span>
                            <strong>Weight:</strong> {pt.weight ? `${pt.weight}kg` : '—'}
                          </span>
                        </div>

                        {pt.medicalHistory && (
                          <div className="doc-pt-diagnosis">
                            <strong>Known Conditions:</strong> {pt.medicalHistory}
                          </div>
                        )}

                        <div className="doc-pt-wellness-summary">
                          <div className="doc-wellness-item">
                            <span className="doc-wellness-label">Active Meds</span>
                            <span className="doc-wellness-val">💊 {pt.activePrescriptionsCount}</span>
                          </div>
                          <div className="doc-wellness-item">
                            <span className="doc-wellness-label">Latest Mood</span>
                            <span className="doc-wellness-val">
                              {moodEmoji} {pt.latestMood?.mood?.replace('_', ' ') || 'None'}
                            </span>
                          </div>
                          <div className="doc-wellness-item">
                            <span className="doc-wellness-label">Latest Screening</span>
                            <span className="doc-wellness-val">
                              {pt.latestScreening
                                ? `${pt.latestScreening.type?.toUpperCase()} (${pt.latestScreening.indication})`
                                : 'None'}
                            </span>
                          </div>
                        </div>

                        <button
                          className="doc-btn-primary full-width"
                          onClick={() => openPatientRecord(pt._id)}
                        >
                          Review Clinical Record 📋
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: APPOINTMENTS ==================== */}
        {activeTab === 'appointments' && (
          <div className="doc-tab-content">
            <div className="doc-card">
              <div className="doc-card-header">
                <div>
                  <span className="doc-card-eyebrow">Consultation Schedule</span>
                  <h2>Patient Consultations</h2>
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="doc-empty-state">
                  <p>No consultations scheduled yet.</p>
                  <span>When patients book an appointment, it will appear here.</span>
                </div>
              ) : (
                <div className="doc-appts-list">
                  {appointments.map((appt) => {
                    const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={appt._id} className="doc-appt-item">
                        <div className="doc-appt-left">
                          <div className="doc-appt-date-box">
                            <span className="doc-appt-time">{appt.time}</span>
                            <span className="doc-appt-date">{formattedDate}</span>
                          </div>
                          <div>
                            <h4 className="doc-appt-patient">{appt.patientName}</h4>
                            <p className="doc-appt-reason">
                              <strong>Reason:</strong> {appt.reason}
                            </p>
                            <span className="doc-appt-type">Mode: {appt.type}</span>
                            {appt.clinicalNotes && (
                              <p className="doc-appt-notes">
                                <strong>Clinical Note:</strong> {appt.clinicalNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="doc-appt-actions">
                          <span
                            className={`doc-appt-status-badge ${
                              appt.status === 'completed'
                                ? 'status-completed'
                                : appt.status === 'cancelled'
                                ? 'status-cancelled'
                                : 'status-scheduled'
                            }`}
                          >
                            {appt.status?.toUpperCase()}
                          </span>

                          {appt.status === 'scheduled' && (
                            <div className="doc-action-btn-group">
                              <button
                                className="doc-btn-sm doc-btn-success"
                                onClick={() => handleUpdateAppointmentStatus(appt._id, 'completed')}
                              >
                                ✓ Complete
                              </button>
                              <button
                                className="doc-btn-sm doc-btn-danger"
                                onClick={() => handleUpdateAppointmentStatus(appt._id, 'cancelled')}
                              >
                                ✕ Cancel
                              </button>
                            </div>
                          )}

                          <button
                            className="doc-btn-sm doc-btn-secondary"
                            onClick={() => {
                              setEditingApptId(appt._id);
                              setClinicalNoteText(appt.clinicalNotes || '');
                            }}
                          >
                            📝 Add / Edit Note
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== PATIENT FULL RECORD MODAL ==================== */}
      {selectedPatientId && (
        <div className="doc-modal-overlay" onClick={closePatientRecord}>
          <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <div>
                <span className="doc-card-eyebrow">Comprehensive Patient Record</span>
                <h2>{patientRecord?.patient?.name || 'Patient Details'}</h2>
              </div>
              <button className="doc-close-btn" onClick={closePatientRecord}>
                ✕
              </button>
            </div>

            {loadingRecord ? (
              <p style={{ textAlign: 'center', padding: '3rem' }}>Loading clinical record…</p>
            ) : patientRecord ? (
              <div className="doc-modal-body">
                {/* 1. Clinical Profile & Emergency Contact */}
                <div className="doc-section-card">
                  <h3>👤 Patient Vitals & Emergency Contact</h3>
                  <div className="doc-vitals-grid">
                    <div>
                      <strong>Age:</strong> {patientRecord.patient.age || '—'}
                    </div>
                    <div>
                      <strong>Gender:</strong> {patientRecord.patient.gender || '—'}
                    </div>
                    <div>
                      <strong>Height:</strong> {patientRecord.patient.height}cm
                    </div>
                    <div>
                      <strong>Weight:</strong> {patientRecord.patient.weight}kg
                    </div>
                    <div>
                      <strong>BMI:</strong> {patientRecord.patient.bmi || '—'}
                    </div>
                    <div>
                      <strong>Email:</strong> {patientRecord.patient.email}
                    </div>
                  </div>

                  {patientRecord.patient.medicalHistory && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                      <strong>Medical History / Diagnoses:</strong> {patientRecord.patient.medicalHistory}
                    </p>
                  )}

                  {patientRecord.patient.emergencyContact?.name && (
                    <div className="doc-emergency-info-box">
                      <strong>🚨 Emergency Contact:</strong> {patientRecord.patient.emergencyContact.name} (
                      {patientRecord.patient.emergencyContact.relationship || 'Guardian'}) •{' '}
                      {patientRecord.patient.emergencyContact.email} • {patientRecord.patient.emergencyContact.phone}
                    </div>
                  )}
                </div>

                {/* 2. Active Prescriptions */}
                <div className="doc-section-card">
                  <h3>💊 Active Prescriptions ({patientRecord.prescriptions.length})</h3>
                  {patientRecord.prescriptions.length === 0 ? (
                    <p style={{ color: '#5B6B65', fontSize: '0.88rem' }}>No medication reminders logged.</p>
                  ) : (
                    <div className="doc-records-list">
                      {patientRecord.prescriptions.map((med) => (
                        <div key={med._id} className="doc-record-row">
                          <div>
                            <strong>{med.name}</strong> — {med.dosage} at {med.time} ({med.mealSegment?.replace('_', ' ')})
                            {med.notes && <div style={{ fontSize: '0.8rem', color: '#5B6B65' }}>Note: {med.notes}</div>}
                          </div>
                          <span className={`doc-med-status status-${med.status}`}>{med.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Mood & Emotion Trends */}
                <div className="doc-section-card">
                  <h3>📈 Mood & Emotion Tracking Logs ({patientRecord.moodEntries.length})</h3>
                  {patientRecord.moodEntries.length === 0 ? (
                    <p style={{ color: '#5B6B65', fontSize: '0.88rem' }}>No mood entries recorded yet.</p>
                  ) : (
                    <div className="doc-records-list">
                      {patientRecord.moodEntries.slice(0, 10).map((m) => (
                        <div key={m._id} className="doc-record-row">
                          <div>
                            <strong>{m.mood.replace('_', ' ').toUpperCase()}</strong> • Score: {m.moodScore}/5
                            {m.emotions && m.emotions.length > 0 && (
                              <div style={{ fontSize: '0.78rem', color: '#146356' }}>
                                Tags: {m.emotions.join(', ')}
                              </div>
                            )}
                            {m.note && <div style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>“{m.note}”</div>}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#5B6B65' }}>
                            {new Date(m.entryDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Mental Well-being Screenings */}
                <div className="doc-section-card">
                  <h3>🧠 Mental Well-being Screenings ({patientRecord.screenings.length})</h3>
                  {patientRecord.screenings.length === 0 ? (
                    <p style={{ color: '#5B6B65', fontSize: '0.88rem' }}>No screening questionnaires completed.</p>
                  ) : (
                    <div className="doc-records-list">
                      {patientRecord.screenings.map((sc) => (
                        <div key={sc._id} className="doc-record-row">
                          <div>
                            <strong style={{ textTransform: 'capitalize' }}>{sc.screeningType} Screening</strong>
                            <div style={{ fontSize: '0.82rem', color: '#5B6B65' }}>
                              Score: {sc.totalScore}/{sc.maxScore} • Indication: {sc.indicationLevel.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#1F2937' }}>{sc.summary}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#5B6B65' }}>
                            {new Date(sc.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ==================== EDIT CLINICAL NOTE MODAL ==================== */}
      {editingApptId && (
        <div className="doc-modal-overlay" onClick={() => setEditingApptId(null)}>
          <div className="doc-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h3>Add Clinical Note</h3>
              <button className="doc-close-btn" onClick={() => setEditingApptId(null)}>
                ✕
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #D8E3E0',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                }}
                placeholder="Enter diagnostic impressions, follow-up instructions, or medication adjustments…"
                value={clinicalNoteText}
                onChange={(e) => setClinicalNoteText(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="doc-btn-secondary" onClick={() => setEditingApptId(null)}>
                  Cancel
                </button>
                <button
                  className="doc-btn-primary"
                  disabled={savingAppt}
                  onClick={() => handleSaveClinicalNote(editingApptId)}
                >
                  {savingAppt ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
