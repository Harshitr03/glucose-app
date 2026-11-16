import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import FormError from '../../components/FormError';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api('/patients').then((data) => setPatients(data.patients)).catch(setError);
  }, []);

  useEffect(load, [load]);

  async function invite(event) {
    event.preventDefault();
    setInviteError(null);
    setMessage('');
    try {
      const { patient } = await api('/patients', { method: 'POST', body: { email } });
      setMessage(`Invitation sent to ${patient.name}. They need to accept it before you can see their reports.`);
      setEmail('');
      load();
    } catch (err) {
      setInviteError(err);
    }
  }

  async function remove(patient) {
    if (!window.confirm(`Remove ${patient.name} from your patients?`)) return;
    try {
      await api(`/patient?id=${patient.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <>
      <h1>Patients</h1>
      <section className="panel">
        <h2>Invite a patient</h2>
        <form className="inline-form" onSubmit={invite} noValidate>
          <label>
            Patient's email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button type="submit">Send invitation</button>
        </form>
        <FormError error={inviteError} />
        {message && <p className="form-success">{message}</p>}
      </section>

      <section className="panel">
        <h2>Your patients</h2>
        <FormError error={error} />
        {patients.length === 0 ? (
          <p className="empty">No patients yet. Invite one by email above.</p>
        ) : (
          <ul className="people">
            {patients.map((patient) => (
              <li key={patient.id}>
                <div>
                  {patient.status === 'accepted' ? (
                    <Link to={`/patients/${patient.id}`}>
                      <strong>{patient.name}</strong>
                    </Link>
                  ) : (
                    <strong>{patient.name}</strong>
                  )}
                  <small>
                    {patient.email}
                    {patient.status === 'pending' && ' · Waiting for them to accept'}
                  </small>
                </div>
                <button type="button" className="link-button danger" onClick={() => remove(patient)}>
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
