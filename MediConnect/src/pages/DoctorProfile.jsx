import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDoctorById } from '../api/doctorApi';
import '../styles/HospitalFinder.css';

export default function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setDoctor(await fetchDoctorById(id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="hospital-finder">Loading...</div>;
  if (error) return <div className="hospital-finder"><div className="hf-error">{error}</div></div>;
  if (!doctor) return null;

  return (
    <div className="hospital-finder">
      <Link to="/hospitals" className="hf-back-link">&larr; Back to hospital search</Link>

      <div className="hf-profile-card">
        <h1>{doctor.name}</h1>
        <p className="hf-profile-specialty">{doctor.specialty}</p>
        <p className="hf-profile-exp">{doctor.experienceYears} years of experience</p>
        <p className="hf-rating">Rating: {doctor.rating.toFixed(1)} / 5</p>

        {doctor.bio && <p className="hf-profile-bio">{doctor.bio}</p>}

        {doctor.hospitalId && (
          <p className="hf-profile-hospital">
            Practices at <strong>{doctor.hospitalId.name}</strong> — {doctor.hospitalId.address}
          </p>
        )}

        <h2>Available Time Slots</h2>
        {doctor.availableSlots.length === 0 ? (
          <p>No available slots listed.</p>
        ) : (
          <ul className="hf-slot-list">
            {doctor.availableSlots.map((slot, i) => (
              <li key={i}>
                <strong>{slot.day}</strong> — {slot.startTime} to {slot.endTime}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
