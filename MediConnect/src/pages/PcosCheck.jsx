import { useEffect, useState } from 'react';
import { fetchPcosProfile, savePcosProfile, fetchPcosScreening } from '../api/pcosApi';
import '../styles/PcosCheck.css';

const EMPTY_PROFILE = {
  acne: false,
  excessHairGrowth: false,
  hairThinning: false,
  weightGain: false,
  skinDarkening: false,
  familyHistoryPCOS: false,
  notes: '',
};

export default function PcosCheck() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [profileData, screeningData] = await Promise.all([
          fetchPcosProfile(),
          fetchPcosScreening(),
        ]);
        if (isMounted) {
          setProfile({ ...EMPTY_PROFILE, ...profileData });
          setScreening(screeningData);
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
  }, []);

  function toggle(field) {
    setProfile((p) => ({ ...p, [field]: !p[field] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await savePcosProfile(profile);
      const screeningData = await fetchPcosScreening();
      setScreening(screeningData);
      setSuccessMsg('Your symptom profile has been saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const resultClass = screening
    ? screening.result === 'No pattern currently detected'
      ? 'none'
      : screening.result === 'Multiple PCOS-related patterns detected'
      ? 'multiple'
      : 'single'
    : '';

  return (
    <div className="pcos-page">
      <div className="pcos-shell">
        <p className="pcos-eyebrow">Menstrual health</p>
        <h1>PCOS Pattern Check</h1>
        <p className="pcos-subtitle">
          This screening looks for patterns in your recorded cycles and symptoms. It is not a
          diagnosis.
        </p>

        {error && <div className="pcos-error-banner">{error}</div>}
        {successMsg && <div className="pcos-success-banner">{successMsg}</div>}

        {loading ? (
          <p className="pcos-muted">Loading…</p>
        ) : (
          <>
            {screening && (
              <div className={`pcos-result pcos-result-${resultClass}`}>
                <p className="pcos-result-title">{screening.result}</p>
                {screening.matchedFlags.length > 0 && (
                  <ul className="pcos-flag-list">
                    {screening.matchedFlags.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form className="pcos-form" onSubmit={handleSubmit}>
              <h2>Additional symptoms</h2>
              <p className="pcos-form-hint">
                These are self-reported and optional — check anything that currently applies to you.
              </p>

              <label className="pcos-checkbox">
                <input type="checkbox" checked={profile.acne} onChange={() => toggle('acne')} />
                Acne
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={profile.excessHairGrowth}
                  onChange={() => toggle('excessHairGrowth')}
                />
                Excess hair growth
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={profile.hairThinning}
                  onChange={() => toggle('hairThinning')}
                />
                Hair thinning / hair loss
              </label>
              <label className="pcos-checkbox">
                <input type="checkbox" checked={profile.weightGain} onChange={() => toggle('weightGain')} />
                Unexplained weight gain
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={profile.skinDarkening}
                  onChange={() => toggle('skinDarkening')}
                />
                Skin darkening
              </label>
              <label className="pcos-checkbox">
                <input
                  type="checkbox"
                  checked={profile.familyHistoryPCOS}
                  onChange={() => toggle('familyHistoryPCOS')}
                />
                Family history of PCOS
              </label>

              <div className="pcos-field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  value={profile.notes}
                  onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Anything else you'd like to note"
                />
              </div>

              <button type="submit" className="pcos-btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save & re-check'}
              </button>
            </form>
          </>
        )}

        <div className="pcos-disclaimer">
          {screening?.disclaimer ||
            'This is only a screening flag based on the information you have entered. It is not a medical diagnosis. Please discuss any concerns with a gynecologist or qualified healthcare provider.'}
        </div>
      </div>
    </div>
  );
}