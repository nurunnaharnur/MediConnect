import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyHospitals } from '../api/hospitalApi';
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

export default function HospitalFinder() {
  const navigate = useNavigate();

  const [coords, setCoords] = useState(null); // { lat, lng }
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [maxDistanceKm, setMaxDistanceKm] = useState('10');
  const [specialty, setSpecialty] = useState('');
  const [minRating, setMinRating] = useState('');

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [expandedHospitalId, setExpandedHospitalId] = useState(null);
  const [doctorsByHospital, setDoctorsByHospital] = useState({});

  // FR-9: try GPS first; the manual lat/lng fields below are always available as a fallback
  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError('GPS is not available in this browser — please enter your location manually.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your GPS location — please enter it manually below.');
        setLocating(false);
      }
    );
  }

  function useManualLocation(e) {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setLocationError('Please enter valid numeric latitude and longitude.');
      return;
    }
    setLocationError('');
    setCoords({ lat, lng });
  }

  async function search() {
    if (!coords) return;
    setLoading(true);
    setError('');
    try {
      const results = await fetchNearbyHospitals({
        lat: coords.lat,
        lng: coords.lng,
        maxDistanceKm,
        specialty: specialty || undefined,
        minRating: minRating || undefined,
      });
      setHospitals(results);
      setExpandedHospitalId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (coords) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

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
        setError(err.message);
      }
    }
  }

  return (
    <div className="hospital-finder">
      <h1>Find a Hospital or Clinic</h1>
      <p className="hf-subtitle">Search nearby hospitals and filter by specialty, distance, or rating.</p>

      <div className="hf-location-box">
        <button onClick={useMyLocation} disabled={locating} className="hf-gps-btn">
          {locating ? 'Locating...' : 'Use My Current Location'}
        </button>

        <form onSubmit={useManualLocation} className="hf-manual-form">
          <input
            type="text"
            placeholder="Latitude (e.g. 23.7519)"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
          />
          <input
            type="text"
            placeholder="Longitude (e.g. 90.3866)"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
          />
          <button type="submit">Set Manually</button>
        </form>

        {locationError && <div className="hf-error">{locationError}</div>}
        {coords && (
          <div className="hf-coords">
            Searching near {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </div>
        )}
      </div>

      {coords && (
        <div className="hf-filters">
          <label>
            Max distance
            <select value={maxDistanceKm} onChange={(e) => setMaxDistanceKm(e.target.value)}>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </label>

          <label>
            Specialty
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">Any</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label>
            Min. rating
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </label>

          <button onClick={search} disabled={loading} className="hf-search-btn">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      )}

      {error && <div className="hf-error">{error}</div>}

      <div className="hf-results">
        {hospitals.map((h) => (
          <div key={h._id} className="hf-card">
            <div className="hf-card-header">
              <h3>{h.name}</h3>
              <span className="hf-distance">{(h.distanceMeters / 1000).toFixed(1)} km away</span>
            </div>
            <p className="hf-address">{h.address}</p>
            <p className="hf-rating">Rating: {h.rating.toFixed(1)} / 5</p>
            <div className="hf-tags">
              {h.specialties.map((s) => <span key={s} className="hf-tag">{s}</span>)}
            </div>
            <button onClick={() => toggleDoctors(h._id)} className="hf-doctors-btn">
              {expandedHospitalId === h._id ? 'Hide Doctors' : 'View Doctors'}
            </button>

            {expandedHospitalId === h._id && (
              <div className="hf-doctor-list">
                {(doctorsByHospital[h._id] || []).map((doc) => (
                  <div key={doc._id} className="hf-doctor-row" onClick={() => navigate(`/doctors/${doc._id}`)}>
                    <span className="hf-doctor-name">{doc.name}</span>
                    <span className="hf-doctor-specialty">{doc.specialty}</span>
                    <span className="hf-doctor-exp">{doc.experienceYears} yrs exp.</span>
                  </div>
                ))}
                {doctorsByHospital[h._id] && doctorsByHospital[h._id].length === 0 && (
                  <p className="hf-no-doctors">No doctors listed for this hospital yet.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {!loading && coords && hospitals.length === 0 && (
          <p>No hospitals found within {maxDistanceKm} km matching your filters.</p>
        )}
      </div>
    </div>
  );
}
