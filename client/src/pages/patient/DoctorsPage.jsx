import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import FormError from '../../components/FormError';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api('/doctors').then((data) => setDoctors(data.doctors)).catch(setError);
  }, []);

  useEffect(load, [load]);

  async function run(action) {
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError(err);
    }
  }

  const accept = (doctor) => run(() => api(`/doctor/accept?id=${doctor.id}`, { method: 'POST' }));
  const remove = (doctor, question) => {
    if (window.confirm(question)) run(() => api(`/doctor?id=${doctor.id}`, { method: 'DELETE' }));
  };

  const pending = doctors.filter((doctor) => doctor.status === 'pending');
  const accepted = doctors.filter((doctor) => doctor.status === 'accepted');

  return (
    <>
      <h1>My doctors</h1>
      <FormError error={error} />

      {pending.length > 0 && (
        <section className="panel">
          <h2>Invitations</h2>
          <ul className="people">
            {pending.map((doctor) => (
              <li key={doctor.id}>
                <div>
                  <strong>{doctor.name}</strong> wants to view your readings and reports.
                  <small>{doctor.email}</small>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => accept(doctor)}>
                    Accept
                  </button>
                  <button type="button" className="secondary" onClick={() => remove(doctor, `Decline ${doctor.name}'s invitation?`)}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2>Doctors who can see your reports</h2>
        {accepted.length === 0 ? (
          <p className="empty">No doctors yet. When a doctor invites you, the invitation shows up here.</p>
        ) : (
          <ul className="people">
            {accepted.map((doctor) => (
              <li key={doctor.id}>
                <div>
                  <strong>{doctor.name}</strong>
                  <small>{doctor.email}</small>
                </div>
                <button type="button" className="link-button danger" onClick={() => remove(doctor, `Stop sharing with ${doctor.name}?`)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
