import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import FormError from '../../components/FormError';
import { useFeedback } from '../../feedback/FeedbackContext';
import useDocumentTitle from '../../useDocumentTitle';

export default function DoctorsPage() {
  useDocumentTitle('My doctors');
  const { confirm, showToast } = useFeedback();
  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api('/doctors').then((data) => setDoctors(data.doctors)).catch(setError);
  }, []);

  useEffect(load, [load]);

  async function run(action, doneMessage) {
    setError(null);
    try {
      await action();
      showToast(doneMessage);
      load();
      window.dispatchEvent(new Event('sweety:invites-changed'));
    } catch (err) {
      setError(err);
    }
  }

  const accept = (doctor) =>
    run(() => api(`/doctor/accept?id=${doctor.id}`, { method: 'POST' }), `${doctor.name} can now see your reports.`);

  async function decline(doctor) {
    await run(() => api(`/doctor?id=${doctor.id}`, { method: 'DELETE' }), `Declined ${doctor.name}'s invitation.`);
  }

  async function stopSharing(doctor) {
    const ok = await confirm({
      title: `Stop sharing with ${doctor.name}?`,
      body: 'They will no longer see your readings or reports. They would need to invite you again.',
      confirmLabel: 'Stop sharing',
      danger: true,
    });
    if (ok) await run(() => api(`/doctor?id=${doctor.id}`, { method: 'DELETE' }), `Stopped sharing with ${doctor.name}.`);
  }

  const pending = (doctors ?? []).filter((doctor) => doctor.status === 'pending');
  const accepted = (doctors ?? []).filter((doctor) => doctor.status === 'accepted');

  return (
    <>
      <header className="page-header">
        <div>
          <h1>My doctors</h1>
          <p className="subtle">Doctors you accept can see your readings and reports. They cannot change them.</p>
        </div>
      </header>
      <FormError error={error} />

      {pending.length > 0 && (
        <section className="panel invite-card" aria-labelledby="invites-heading">
          <h2 id="invites-heading">{pending.length === 1 ? 'New invitation' : `${pending.length} new invitations`}</h2>
          <ul className="people">
            {pending.map((doctor) => (
              <li key={doctor.id}>
                <div>
                  <span className="person-name">{doctor.name}</span> wants to see your readings and reports.
                  <small>{doctor.email}</small>
                </div>
                <div className="row-actions">
                  <button type="button" className="small" onClick={() => accept(doctor)}>
                    Accept
                  </button>
                  <button type="button" className="secondary small" onClick={() => decline(doctor)}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel" aria-labelledby="doctors-heading">
        <h2 id="doctors-heading">Sharing with</h2>
        {doctors === null ? (
          <p className="loading">Loading doctors…</p>
        ) : accepted.length === 0 ? (
          <p className="empty">You are not sharing with any doctor yet. When a doctor invites you, the invitation appears on this page.</p>
        ) : (
          <ul className="people">
            {accepted.map((doctor) => (
              <li key={doctor.id}>
                <div>
                  <span className="person-name">{doctor.name}</span>
                  <small>{doctor.email}</small>
                </div>
                <button type="button" className="danger small" onClick={() => stopSharing(doctor)}>
                  Stop sharing
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
