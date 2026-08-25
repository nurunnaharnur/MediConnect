import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSharedReportById } from '../api/sharedReportApi';
import { downloadReport } from '../api/healthReportApi';
import {
  fetchDiagnosesForSharedReport,
  createDiagnosis,
  updateDiagnosis,
} from '../api/diagnosisApi';
import '../styles/DoctorReports.css';

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };
const EMPTY_FORM = { diagnosisNotes: '', observations: '', recommendations: '', medicines: [] };

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DoctorReportDetail() {
  const { id } = useParams();
  const [shared, setShared] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [sharedData, diagnosesData] = await Promise.all([
          fetchSharedReportById(id),
          fetchDiagnosesForSharedReport(id),
        ]);
        if (isMounted) {
          setShared(sharedData);
          setDiagnoses(diagnosesData);
        }
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
  }, [id]);

  async function handleDownloadPDF() {
    if (!shared?.reportId?._id) return;
    setDownloading(true);
    setError('');
    try {
      await downloadReport(shared.reportId._id, shared.reportId.pdfFileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(diagnosis) {
    setEditingId(diagnosis._id);
    setForm({
      diagnosisNotes: diagnosis.diagnosisNotes || '',
      observations: diagnosis.observations || '',
      recommendations: diagnosis.recommendations || '',
      medicines: diagnosis.medicines?.length ? diagnosis.medicines.map((m) => ({ ...m })) : [],
    });
    setFormError('');
    setShowForm(true);
  }

  function addMedicine() {
    setForm((f) => ({ ...f, medicines: [...f.medicines, { ...EMPTY_MEDICINE }] }));
  }

  function updateMedicine(index, field, value) {
    setForm((f) => {
      const medicines = [...f.medicines];
      medicines[index] = { ...medicines[index], [field]: value };
      return { ...f, medicines };
    });
  }

  function removeMedicine(index) {
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.diagnosisNotes.trim()) {
      setFormError('Diagnosis notes are required.');
      return;
    }
    for (const m of form.medicines) {
      if (!m.name || !m.dosage || !m.frequency || !m.duration) {
        setFormError('Each medicine needs a name, dosage, frequency, and duration.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateDiagnosis(editingId, form);
        setDiagnoses((list) => list.map((d) => (d._id === editingId ? updated : d)));
      } else {
        const created = await createDiagnosis({ sharedReportId: id, ...form });
        setDiagnoses((list) => [created, ...list]);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="docrep-page">
        <div className="docrep-shell">
          <p className="docrep-muted">Loading confidential patient report…</p>
        </div>
      </div>
    );
  }

  if (error && !shared) {
    return (
      <div className="docrep-page">
        <div className="docrep-shell">
          <div className="docrep-error-banner">{error}</div>
          <Link to="/doctor/reports" className="docrep-btn-secondary">← Back to shared reports</Link>
        </div>
      </div>
    );
  }

  const snapshot = shared.reportId?.clinicalDataSnapshot;

  return (
    <div className="docrep-page">
      <div className="docrep-shell">
        <Link to="/doctor/reports" className="docrep-back-link">← Back to shared reports</Link>

        {error && <div className="docrep-error-banner">{error}</div>}

        <div className="docrep-detail-header">
          <div>
            <p className="docrep-eyebrow">Exclusively Designated Patient</p>
            <h1>{shared.patientId?.name}</h1>
            <p className="docrep-patient-meta">
              {shared.patientId?.age ? `${shared.patientId.age} yrs · ` : ''}
              {shared.patientId?.gender || ''}
              {shared.reportId?.vitalsSnapshot?.bmi ? ` · BMI: ${shared.reportId.vitalsSnapshot.bmi} kg/m²` : ''}
            </p>
            {shared.patientId?.medicalHistory && (
              <p className="docrep-patient-history">Known History: {shared.patientId.medicalHistory}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span className={`docrep-status-tag ${(shared.status || 'shared').toLowerCase()}`}>{shared.status}</span>
            <button
              className="docrep-btn-primary"
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
            >
              {downloading ? 'Downloading…' : '📥 Download Official PDF'}
            </button>
          </div>
        </div>

        {/* Clinical Report Focus Box */}
        <div className="docrep-report-box" style={{ borderLeft: '4px solid #146356' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, color: '#146356', fontFamily: 'Space Grotesk, sans-serif' }}>
              🎯 Target Focus: {shared.reportId?.diseaseFocus || 'General Clinical Health'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#5B6B65' }}>
              Generated: {formatDate(shared.reportId?.generatedAt)}
            </span>
          </div>

          <p className="docrep-report-severity">
            Severity Rating: <strong>{shared.reportId?.severity}</strong>
          </p>
          <p className="docrep-report-symptoms" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
            <strong>Patient Symptoms &amp; Chief Complaint:</strong> {shared.reportId?.symptoms}
          </p>

          {/* Clinical Data Snapshot Items if available */}
          {snapshot && (
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px dashed #DDE4E2' }}>
              <strong style={{ fontSize: '0.85rem', color: '#16241F' }}>Attached Clinical Snapshot:</strong>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.82rem', color: '#374151' }}>
                {snapshot.medications && snapshot.medications.length > 0 && (
                  <div>
                    <strong>💊 Prescriptions ({snapshot.medications.length}):</strong>{' '}
                    {snapshot.medications.map((m) => m.name).join(', ')}
                  </div>
                )}
                {snapshot.vitals && snapshot.vitals.length > 0 && (
                  <div>
                    <strong>🫀 Recent BP:</strong> {snapshot.vitals[0].systolic}/{snapshot.vitals[0].diastolic} mmHg ({snapshot.vitals[0].status})
                  </div>
                )}
                {snapshot.screenings && snapshot.screenings.length > 0 && (
                  <div>
                    <strong>🧠 Screening:</strong> {snapshot.screenings[0].type} ({snapshot.screenings[0].indication || 'Normal'})
                  </div>
                )}
                {snapshot.cycleInfo && (
                  <div>
                    <strong>🌸 Cycle:</strong> {snapshot.cycleInfo.phase} (Day {snapshot.cycleInfo.currentDay})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="docrep-diagnoses-header">
          <h2>Clinical Diagnosis &amp; Prescriptions</h2>
          <button className="docrep-btn-primary" onClick={openCreateForm}>
            + Add Diagnosis &amp; Prescribe
          </button>
        </div>

        {diagnoses.length === 0 ? (
          <div className="docrep-empty">
            <p className="docrep-empty-title">No Doctor Diagnosis Recorded Yet</p>
            <p>Add your clinical notes, diagnostic conclusions, and prescribed medications for this patient's condition.</p>
          </div>
        ) : (
          <div className="docrep-list">
            {diagnoses.map((d) => (
              <div key={d._id} className="docrep-diagnosis-card">
                <div className="docrep-diagnosis-header">
                  <span className="docrep-diagnosis-date">{formatDate(d.createdAt)}</span>
                  <button className="docrep-btn-secondary" onClick={() => openEditForm(d)}>
                    Edit
                  </button>
                </div>
                <p className="docrep-section-title">Diagnosis Notes</p>
                <p className="docrep-text">{d.diagnosisNotes}</p>
                {d.observations && (
                  <>
                    <p className="docrep-section-title">Clinical Observations</p>
                    <p className="docrep-text">{d.observations}</p>
                  </>
                )}
                {d.recommendations && (
                  <>
                    <p className="docrep-section-title">Recommendations</p>
                    <p className="docrep-text">{d.recommendations}</p>
                  </>
                )}
                {d.medicines?.length > 0 && (
                  <>
                    <p className="docrep-section-title">Prescribed Medications</p>
                    <div className="docrep-medicine-table">
                      {d.medicines.map((m, i) => (
                        <div key={i} className="docrep-medicine-row">
                          <span className="docrep-medicine-name">{m.name}</span>
                          <span>{m.dosage}</span>
                          <span>{m.frequency}</span>
                          <span>{m.duration}</span>
                          {m.instructions && <span className="docrep-medicine-instructions">{m.instructions}</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="docrep-overlay" onClick={() => setShowForm(false)}>
          <div className="docrep-form-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Diagnosis' : 'Submit Official Diagnosis & Prescription'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="docrep-field">
                <label htmlFor="diagnosisNotes">Diagnosis Notes &amp; Findings *</label>
                <textarea
                  id="diagnosisNotes"
                  value={form.diagnosisNotes}
                  placeholder="Clinical assessment, diagnosis, condition stage..."
                  onChange={(e) => setForm((f) => ({ ...f, diagnosisNotes: e.target.value }))}
                  required
                />
              </div>

              <div className="docrep-field">
                <label htmlFor="observations">Clinical Observations (Optional)</label>
                <textarea
                  id="observations"
                  value={form.observations}
                  placeholder="Observed vitals, test remarks, symptom patterns..."
                  onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
                />
              </div>

              <div className="docrep-field">
                <label htmlFor="recommendations">Diet, Exercise &amp; Care Recommendations (Optional)</label>
                <textarea
                  id="recommendations"
                  value={form.recommendations}
                  placeholder="Dietary changes, follow-up tests, exercise guidance..."
                  onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
                />
              </div>

              <div className="docrep-medicine-editor">
                <div className="docrep-medicine-editor-header">
                  <label>Prescribe Medications (Optional)</label>
                  <button type="button" className="docrep-btn-secondary" onClick={addMedicine}>
                    + Add Medicine
                  </button>
                </div>
                {form.medicines.map((m, index) => (
                  <div key={index} className="docrep-medicine-editor-row">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={m.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={m.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g. Twice daily)"
                      value={m.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 7 days)"
                      value={m.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Instructions (e.g. After meals)"
                      value={m.instructions}
                      onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                    />
                    <button type="button" className="docrep-remove-row" onClick={() => removeMedicine(index)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {formError && <p className="docrep-form-error">{formError}</p>}

              <div className="docrep-form-actions">
                <button type="button" className="docrep-btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="docrep-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Diagnosis' : 'Save & Issue Diagnosis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}