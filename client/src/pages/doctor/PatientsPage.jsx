import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import FormError from '../../components/FormError';
import useDocumentTitle from '../../useDocumentTitle';

export default function PatientsPage() {
  useDocumentTitle('Patients');
  const navigate = useNavigate();
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
        {patients === null ? (
          <p className="loading">Loading patients…</p>
        ) : patients.length === 0 ? (
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
                    <button type="button" className="secondary small" onClick={() => navigate(`/patients/${patient.id}`)}>
                      View reports
                    </button>
                  )}
                  <button type="button" className="danger small" onClick={() => remove(patient)}>
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
