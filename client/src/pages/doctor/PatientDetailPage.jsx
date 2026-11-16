import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import ReportSection from '../../components/ReportSection';
import ReadingsTable from '../../components/ReadingsTable';
import Pagination from '../../components/Pagination';
import NotesPanel from '../../components/NotesPanel';
import FormError from '../../components/FormError';

const LIMIT = 20;

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [readings, setReadings] = useState({ readings: [], total: 0 });
  const [page, setPage] = useState(1);
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

  const loadReadings = useCallback(() => {
    api(`/patient/readings?id=${id}&page=${page}&limit=${LIMIT}`).then(setReadings).catch(setError);
  }, [id, page]);

  useEffect(() => {
    if (patient) loadReadings();
  }, [patient, loadReadings]);

  if (error) {
    return (
      <>
        <FormError error={error} />
        <Link to="/patients">Back to patients</Link>
      </>
    );
  }
  if (!patient) return <p>Loading…</p>;

  return (
    <>
      <Link to="/patients">Back to patients</Link>
      <h1>{patient.name}</h1>
      <p className="subtle">{patient.email}</p>

      <ReportSection reportsPath={`/patient/reports?id=${id}&`} readingsPath={`/patient/readings?id=${id}&`} />

      <NotesPanel patientId={patient.id} />

      <section className="panel">
        <h2>All readings</h2>
        <ReadingsTable readings={readings.readings} emptyText="This patient has not added any readings yet." />
        <Pagination page={page} limit={LIMIT} total={readings.total} onChange={setPage} />
      </section>
    </>
  );
}
