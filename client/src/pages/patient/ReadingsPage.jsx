import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import ReadingForm from '../../components/ReadingForm';
import ReadingsTable from '../../components/ReadingsTable';
import Pagination from '../../components/Pagination';
import FormError from '../../components/FormError';

const LIMIT = 20;

export default function ReadingsPage() {
  const [data, setData] = useState({ readings: [], total: 0 });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api(`/readings?page=${page}&limit=${LIMIT}`).then(setData).catch(setError);
  }, [page]);

  useEffect(load, [load]);

  async function addReading(values) {
    await api('/readings', { method: 'POST', body: values });
    load();
  }

  async function saveEdit(values) {
    await api(`/reading?id=${editing.id}`, { method: 'PUT', body: values });
    setEditing(null);
    load();
  }

  async function deleteReading(reading) {
    if (!window.confirm('Delete this reading?')) return;
    try {
      await api(`/reading?id=${reading.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <>
      <h1>Readings</h1>
      <section className="panel">
        <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>
        <ReadingForm
          key={editing?.id ?? 'new'}
          reading={editing}
          onSave={editing ? saveEdit : addReading}
          onCancel={() => setEditing(null)}
        />
      </section>
      <section className="panel">
        <h2>All readings</h2>
        <FormError error={error} />
        <ReadingsTable
          readings={data.readings}
          onEdit={setEditing}
          onDelete={deleteReading}
          emptyText="No readings yet. Add your first one above."
        />
        <Pagination page={page} limit={LIMIT} total={data.total} onChange={setPage} />
      </section>
    </>
  );
}
