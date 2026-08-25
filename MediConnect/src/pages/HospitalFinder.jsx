import { useEffect, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyHospitals, fetchAllHospitals } from '../api/hospitalApi';
import { fetchDoctors } from '../api/doctorApi';
import '../styles/HospitalFinder.css';

const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Gastroenterologist',
  'Endocrinologist',
  'Psychiatrist / Clinical Psychologist',
  'Gynecologist',
  'Orthopedic / Rheumatologist',
];

const PRESET_LOCATIONS = [
  { name: 'Panthapath / Dhanmondi, Dhaka', lat: 23.7519, lng: 90.3866 },
  { name: 'Gulshan / Banani, Dhaka', lat: 23.7925, lng: 90.4078 },
  { name: 'Bashundhara R/A, Dhaka', lat: 23.8103, lng: 90.4319 },
  { name: 'Shahbagh / Old Dhaka', lat: 23.7269, lng: 90.3987 },
  { name: 'Mirpur / Kallyanpur, Dhaka', lat: 23.7639, lng: 90.3654 },
];

export default function HospitalFinder() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [coords, setCoords] = useState({ lat: 23.7519, lng: 90.3866 }); // Default near central healthcare zone
  const [manualLat, setManualLat] = useState('23.7519');
  const [manualLng, setManualLng] = useState('90.3866');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [maxDistanceKm, setMaxDistanceKm] = useState('15');
  const [specialty, setSpecialty] = useState('');
  const [minRating, setMinRating] = useState('');

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [expandedHospitalId, setExpandedHospitalId] = useState(null);
  const [doctorsByHospital, setDoctorsByHospital] = useState({});

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError('GPS is not available in your browser — selected Dhaka central hub.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setManualLat(String(pos.coords.latitude.toFixed(4)));
        setManualLng(String(pos.coords.longitude.toFixed(4)));
        setLocating(false);
      },
      () => {
        setLocationError('Could not acquire automatic GPS fix. Using manual coordinates.');
        setLocating(false);
      }
    );
  }

  function handleManualLocation(e) {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setLocationError('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }
    setLocationError('');
    setCoords({ lat, lng });
  }

  function handleSelectPreset(preset) {
    setManualLat(String(preset.lat));
    setManualLng(String(preset.lng));
    setCoords({ lat: preset.lat, lng: preset.lng });
    setLocationError('');
  }

  async function performSearch(currentCoords) {
    setLoading(true);
    setError('');
    try {
      let results = [];
      if (currentCoords) {
        results = await fetchNearbyHospitals({
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          maxDistanceKm,
          specialty: specialty || undefined,
          minRating: minRating || undefined,
        });
      } else {
        results = await fetchAllHospitals({
          specialty: specialty || undefined,
          minRating: minRating || undefined,
        });
      }
      setHospitals(Array.isArray(results) ? results : []);
      setExpandedHospitalId(null);
    } catch (err) {
      console.warn('Geospatial search error, falling back to all hospitals:', err.message);
      try {
        const fallbackResults = await fetchAllHospitals({
          specialty: specialty || undefined,
          minRating: minRating || undefined,
        });
        setHospitals(Array.isArray(fallbackResults) ? fallbackResults : []);
      } catch (fErr) {
        setError(fErr.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startTransition(() => {
      performSearch(coords);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, maxDistanceKm, specialty, minRating]);

  async function toggleDoctors(hospitalId) {
    if (expandedHospitalId === hospitalId) {
      setExpandedHospitalId(null);
      return;
    }
    setExpandedHospitalId(hospitalId);
    if (!doctorsByHospital[hospitalId]) {
      try {
        const doctors = await fetchDoctors({ hospitalId });
        setDoctorsByHospital((prev) => ({ ...prev, [hospitalId]: doctors }));
      } catch (err) {
        console.error('Error fetching hospital doctors:', err);
      }
    }
  }

  return (
    <div className="hf-page">
      <div className="hf-shell">
        <div className="hf-header">
          <p className="hf-eyebrow">Healthcare Facility Discovery</p>
          <h1>Find Nearby Hospitals & Clinics</h1>
          <p className="hf-subtext">
            Search nearby medical centers, filter by medical specialty, distance, and patient ratings, and view doctor profiles with weekly availability slots.
          </p>
        </div>

        {/* Location & GPS Search Box */}
        <div className="hf-location-card">
          <div className="hf-loc-top">
            <div className="hf-loc-title">
              <span className="hf-loc-icon">📍</span>
              <div>
                <h3>Search Center Location</h3>
                <p className="hf-loc-meta">
                  {coords
                    ? `Searching near coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                    : 'Location not set'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="hf-btn-gps"
            >
              {locating ? '🛰️ Acquiring GPS…' : '🛰️ Use Current GPS Location'}
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="hf-presets-wrap">
            <span className="hf-preset-label">Quick Locations:</span>
            {PRESET_LOCATIONS.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`hf-preset-chip ${coords && coords.lat === p.lat ? 'active' : ''}`}
                onClick={() => handleSelectPreset(p)}
              >
                {p.name.split(',')[0]}
              </button>
            ))}
          </div>

          <form onSubmit={handleManualLocation} className="hf-manual-form">
            <div className="hf-manual-inputs">
              <input
                type="text"
                placeholder="Latitude (e.g. 23.7519)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="hf-input"
              />
              <input
                type="text"
                placeholder="Longitude (e.g. 90.3866)"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="hf-input"
              />
            </div>
            <button type="submit" className="hf-btn-manual">
              Set Coordinates
            </button>
          </form>

          {locationError && <div className="hf-alert-warning">{locationError}</div>}
        </div>

        {/* Filters Bar */}
        <div className="hf-filters-bar">
          <div className="hf-filter-field">
            <label htmlFor="maxDist">Max Distance</label>
            <select
              id="maxDist"
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(e.target.value)}
              className="hf-select"
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="15">Within 15 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>

          <div className="hf-filter-field">
            <label htmlFor="specialtyFilter">Specialty / Department</label>
            <select
              id="specialtyFilter"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="hf-select"
            >
              <option value="">All Specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="hf-filter-field">
            <label htmlFor="ratingFilter">Minimum Rating</label>
            <select
              id="ratingFilter"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="hf-select"
            >
              <option value="">Any Rating</option>
              <option value="3">⭐ 3.0+ Stars</option>
              <option value="4">⭐ 4.0+ Stars</option>
              <option value="4.5">⭐ 4.5+ Top Rated</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => performSearch(coords)}
            disabled={loading}
            className="hf-btn-search"
          >
            {loading ? 'Searching…' : '🔍 Apply Filters'}
          </button>
        </div>

        {error && <div className="hf-alert-error">{error}</div>}

        {/* Results List */}
        <div className="hf-results-section">
          <div className="hf-results-header">
            <h3>Discovered Healthcare Facilities ({hospitals.length})</h3>
            <span className="hf-results-badge">
              {specialty ? `Specialty: ${specialty}` : 'All Medical Centers'}
            </span>
          </div>

          {loading ? (
            <div className="hf-loading-state">
              <span className="hf-loading-spinner" />
              <p>Searching for nearby hospitals and clinics…</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="hf-empty-state">
              <span style={{ fontSize: '3rem' }}>🏥</span>
              <h4>No Hospitals Found in Range</h4>
              <p>Try increasing your distance radius or choosing "All Specialties" to see more medical centers.</p>
            </div>
          ) : (
            <div className="hf-grid">
              {hospitals.map((h) => {
                const isExpanded = expandedHospitalId === h._id;
                const distanceKm = h.distanceMeters !== undefined
                  ? (h.distanceMeters / 1000).toFixed(1)
                  : null;

                return (
                  <div key={h._id} className="hf-hospital-card">
                    <div className="hf-card-top">
                      <div>
                        <h4 className="hf-hospital-name">{h.name}</h4>
                        <p className="hf-hospital-address">📍 {h.address}</p>
                        {h.phone && <p className="hf-hospital-phone">📞 {h.phone}</p>}
                      </div>
                      <div className="hf-card-badges">
                        {distanceKm !== null && (
                          <span className="hf-distance-badge">{distanceKm} km away</span>
                        )}
                        <span className="hf-rating-badge">⭐ {Number(h.rating).toFixed(1)} / 5</span>
                      </div>
                    </div>

                    <div className="hf-specialties-wrap">
                      {Array.isArray(h.specialties) &&
                        h.specialties.map((spec) => (
                          <span key={spec} className="hf-specialty-tag">
                            {spec}
                          </span>
                        ))}
                    </div>

                    <div className="hf-card-footer">
                      <button
                        type="button"
                        onClick={() => toggleDoctors(h._id)}
                        className={`hf-btn-view-doctors ${isExpanded ? 'active' : ''}`}
                      >
                        {isExpanded ? '▲ Hide Doctors' : '👨‍⚕️ View Practicing Doctors'}
                      </button>
                    </div>

                    {/* Expandable Doctors List */}
                    {isExpanded && (
                      <div className="hf-doctors-drawer">
                        <h5>Practicing Physicians at {h.name}:</h5>
                        {!doctorsByHospital[h._id] ? (
                          <p className="hf-doc-loading">Loading doctors…</p>
                        ) : doctorsByHospital[h._id].length === 0 ? (
                          <p className="hf-doc-empty">No doctors registered for this hospital yet.</p>
                        ) : (
                          <div className="hf-doctors-list">
                            {doctorsByHospital[h._id].map((doc) => (
                              <div
                                key={doc._id}
                                className="hf-doctor-row"
                                onClick={() => navigate(`/doctors/${doc._id}`)}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="hf-doc-info">
                                  <strong className="hf-doc-name">{doc.name}</strong>
                                  <span className="hf-doc-spec">{doc.specialty}</span>
                                  <span className="hf-doc-exp">{doc.experienceYears} years experience</span>
                                </div>
                                <div className="hf-doc-right">
                                  <span className="hf-doc-rating">⭐ {Number(doc.rating).toFixed(1)}</span>
                                  <span className="hf-doc-cta">View Profile & Hours →</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
