import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import FormError from '../../components/FormError';
import { useFeedback } from '../../feedback/FeedbackContext';
import { formatDate, todayIso } from '../../constants';
import useDocumentTitle from '../../useDocumentTitle';

function daysAgo(iso) {
  const diff = Math.round((new Date(`${todayIso()}T00:00:00Z`) - new Date(`${iso}T00:00:00Z`)) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff} days ago (${formatDate(iso)})`;
}

function PatientActivity({ patient }) {
  if (!patient.lastReadingDate) return <small>No readings yet</small>;
  const percent = patient.recentCount ? Math.round((patient.recentInRange / patient.recentCount) * 100) : null;
  return (
    <small className="patient-activity">
      <span>Last reading {daysAgo(patient.lastReadingDate)}</span>
      {percent !== null && (
        <span className={percent < 50 ? 'activity-alert' : undefined}>
          {percent}% in range over 30 days ({patient.recentCount} readings)
        </span>
      )}
    </small>
  );
}

export default function PatientsPage() {
  useDocumentTitle('Patients');
  const navigate = useNavigate();
  const { confirm, showToast } = useFeedback();
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
    const pending = patient.status === 'pending';
    const ok = await confirm({
      title: pending ? `Cancel the invitation to ${patient.name}?` : `Remove ${patient.name}?`,
      body: pending ? undefined : 'You will no longer see their readings or reports. Your notes stay visible to them.',
      confirmLabel: pending ? 'Cancel invitation' : 'Remove patient',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/patient?id=${patient.id}`, { method: 'DELETE' });
      showToast(pending ? `Cancelled the invitation to ${patient.name}.` : `Removed ${patient.name}.`);
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
                  {patient.status === 'pending' ? (
                    <small className="status-pending">Waiting for them to accept</small>
                  ) : (
                    <PatientActivity patient={patient} />
                  )}
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
