import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { monthRange, todayIso } from '../../constants';
import ReportSection from '../../components/ReportSection';
import Logbook from '../../components/Logbook';
import MonthNav from '../../components/MonthNav';
import OrderToggle from '../../components/OrderToggle';
import NotesPanel from '../../components/NotesPanel';
import FormError from '../../components/FormError';

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [order, setOrder] = useState('oldest');
  const [monthReadings, setMonthReadings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/patients')
      .then((data) => {
        const match = data.patients.find((p) => String(p.id) === id && p.status === 'accepted');
        if (!match) throw new Error('This patient is not on your list.');
        setPatient(match);
      })
      .catch(setError);
  }, [id]);

  useEffect(() => {
    if (!patient) return;
    const { from, to } = monthRange(month);
    api(`/patient/readings?id=${id}&from=${from}&to=${to}&limit=200`)
      .then((data) => setMonthReadings(data.readings))
      .catch(setError);
  }, [patient, id, month]);

  if (error) {
    return (
      <>
        <FormError error={error} />
        <Link to="/patients" className="back-link">Back to patients</Link>
      </>
    );
  }
  if (!patient) return <p className="page-loading">Loading…</p>;

  return (
    <>
      <header className="page-header">
        <div>
          <Link to="/patients" className="back-link">Back to patients</Link>
          <h1>{patient.name}</h1>
          <p className="subtle">{patient.email}</p>
        </div>
      </header>

      <ReportSection reportsPath={`/patient/reports?id=${id}&`} readingsPath={`/patient/readings?id=${id}&`} />

      <NotesPanel patientId={patient.id} />

      <section className="section" aria-labelledby="logbook-heading">
        <div className="section-header">
          <h2 id="logbook-heading">Logbook</h2>
          <div className="row-actions">
            <OrderToggle order={order} onChange={setOrder} />
            <MonthNav month={month} onChange={setMonth} />
          </div>
        </div>
        <Logbook readings={monthReadings} order={order} emptyText="No readings this month." />
      </section>
    </>
  );
}
