import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSharedReportById } from '../api/sharedReportApi';
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
  });
}

export default function DoctorReportDetail() {
  const { id } = useParams();
  const [shared, setShared] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          <p className="docrep-muted">Loading…</p>
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

  return (
    <div className="docrep-page">
      <div className="docrep-shell">
        <Link to="/doctor/reports" className="docrep-back-link">← Back to shared reports</Link>

        {error && <div className="docrep-error-banner">{error}</div>}

        <div className="docrep-detail-header">
          <div>
            <p className="docrep-eyebrow">Patient</p>
            <h1>{shared.patientId?.name}</h1>
            <p className="docrep-patient-meta">
              {shared.patientId?.age ? `${shared.patientId.age} yrs · ` : ''}
              {shared.patientId?.gender || ''}
            </p>
            {shared.patientId?.medicalHistory && (
              <p className="docrep-patient-history">History: {shared.patientId.medicalHistory}</p>
            )}
          </div>
          <span className={`docrep-status-tag ${shared.status.toLowerCase()}`}>{shared.status}</span>
        </div>

        <div className="docrep-report-box">
          <p className="docrep-section-title">Shared report — {formatDate(shared.reportId?.generatedAt)}</p>
          <p className="docrep-report-severity">Severity: {shared.reportId?.severity}</p>
          <p className="docrep-report-symptoms">{shared.reportId?.symptoms}</p>
        </div>

        <div className="docrep-diagnoses-header">
          <h2>Diagnosis &amp; prescriptions</h2>
          <button className="docrep-btn-primary" onClick={openCreateForm}>
            + Add diagnosis
          </button>
        </div>

        {diagnoses.length === 0 ? (
          <div className="docrep-empty">
            <p className="docrep-empty-title">No diagnosis added yet</p>
            <p>Add diagnosis notes and, if needed, a prescription for this patient.</p>
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
                <p className="docrep-section-title">Diagnosis notes</p>
                <p className="docrep-text">{d.diagnosisNotes}</p>
                {d.observations && (
                  <>
                    <p className="docrep-section-title">Observations</p>
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
                    <p className="docrep-section-title">Prescription</p>
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
            <h2>{editingId ? 'Edit diagnosis' : 'Add diagnosis'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="docrep-field">
                <label htmlFor="diagnosisNotes">Diagnosis notes</label>
                <textarea
                  id="diagnosisNotes"
                  value={form.diagnosisNotes}
                  onChange={(e) => setForm((f) => ({ ...f, diagnosisNotes: e.target.value }))}
                />
              </div>

              <div className="docrep-field">
                <label htmlFor="observations">Observations (optional)</label>
                <textarea
                  id="observations"
                  value={form.observations}
                  onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
                />
              </div>

              <div className="docrep-field">
                <label htmlFor="recommendations">Recommendations (optional)</label>
                <textarea
                  id="recommendations"
                  value={form.recommendations}
                  onChange={(e) => setForm((f) => ({ ...f, recommendations: e.target.value }))}
                />
              </div>

              <div className="docrep-medicine-editor">
                <div className="docrep-medicine-editor-header">
                  <label>Prescription (optional)</label>
                  <button type="button" className="docrep-btn-secondary" onClick={addMedicine}>
                    + Add medicine
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
                      placeholder="Dosage"
                      value={m.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={m.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={m.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Instructions (optional)"
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
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save diagnosis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}