import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import FormError from '../../components/FormError';

export default function PatientsPage() {
  const [patients, setPatients] = useState(null);
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
      setMessage(`Invitation sent to ${patient.name}. You can see their reports once they accept.`);
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
      <header className="page-header">
        <h1>Patients</h1>
      </header>

      <section className="panel invite-card" aria-labelledby="invite-heading">
        <h2 id="invite-heading">Invite a patient</h2>
        <form className="inline-form" onSubmit={invite} noValidate>
          <label>
            Patient's email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={inviteError ? 'true' : undefined}
            />
          </label>
          <button type="submit">Send invitation</button>
        </form>
        <FormError error={inviteError} />
        {message && <p className="form-success">{message}</p>}
      </section>

      <section className="panel" aria-labelledby="patients-heading">
        <h2 id="patients-heading">Your patients</h2>
        <FormError error={error} />
        {patients === null ? null : patients.length === 0 ? (
          <p className="empty">No patients yet. Invite one with their email address.</p>
        ) : (
          <ul className="people">
            {patients.map((patient) => (
              <li key={patient.id}>
                <div>
                  {patient.status === 'accepted' ? (
                    <Link to={`/patients/${patient.id}`} className="person-name">
                      {patient.name}
                    </Link>
                  ) : (
                    <span className="person-name">{patient.name}</span>
                  )}
                  <small>{patient.email}</small>
                  {patient.status === 'pending' && <small className="status-pending">Waiting for them to accept</small>}
                </div>
                <div className="row-actions">
                  {patient.status === 'accepted' && (
                    <Link to={`/patients/${patient.id}`}>View reports</Link>
                  )}
                  <button type="button" className="link-button danger" onClick={() => remove(patient)}>
                    {patient.status === 'pending' ? 'Cancel invitation' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
