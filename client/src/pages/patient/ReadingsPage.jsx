import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api';
import { formatDate, monthRange, todayIso } from '../../constants';
import DayStrip from '../../components/DayStrip';
import ReadingForm from '../../components/ReadingForm';
import Logbook from '../../components/Logbook';
import MonthNav from '../../components/MonthNav';
import OrderToggle from '../../components/OrderToggle';
import FormError from '../../components/FormError';

export default function ReadingsPage() {
  const today = todayIso();
  const [todayReadings, setTodayReadings] = useState([]);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [monthReadings, setMonthReadings] = useState(null);
  const [order, setOrder] = useState('oldest');
  const [editing, setEditing] = useState(null);
  const [preset, setPreset] = useState(null);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const load = useCallback(() => {
    const { from, to } = monthRange(month);
    Promise.all([
      api(`/readings?from=${today}&to=${today}`),
      api(`/readings?from=${from}&to=${to}&limit=200`),
    ])
      .then(([todayData, monthData]) => {
        setTodayReadings(todayData.readings);
        setMonthReadings(monthData.readings);
      })
      .catch(setError);
  }, [month, today]);

  useEffect(load, [load]);

  function startEdit(reading) {
    setPreset(null);
    setEditing(reading);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function pickSlot(slot, reading) {
    if (reading) {
      startEdit(reading);
      return;
    }
    setEditing(null);
    setPreset({ date: today, slot });
  }

  function resetForm() {
    setEditing(null);
    setPreset(null);
  }

  async function addReading(values) {
    await api('/readings', { method: 'POST', body: values });
    setPreset(null);
    load();
  }

  async function saveEdit(values) {
    await api(`/reading?id=${editing.id}`, { method: 'PUT', body: values });
    resetForm();
    load();
  }

  async function deleteEditing() {
    if (!window.confirm('Delete this reading? This cannot be undone.')) return;
    try {
      await api(`/reading?id=${editing.id}`, { method: 'DELETE' });
      resetForm();
      load();
    } catch (err) {
      setError(err);
    }
  }

  const formKey = editing ? `edit-${editing.id}` : `new-${preset?.slot ?? ''}`;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Readings</h1>
          <p className="subtle">Today is {formatDate(today)}</p>
        </div>
      </header>

      <section className="section" aria-labelledby="today-heading">
        <h2 id="today-heading">Today</h2>
        <DayStrip readings={todayReadings} selectedSlot={editing?.date === today ? editing.slot : preset?.slot} onPick={pickSlot} />
      </section>

      <section className="panel" ref={formRef} aria-labelledby="form-heading">
        <h2 id="form-heading">{editing ? `Edit reading from ${formatDate(editing.date)}` : 'Add a reading'}</h2>
        <ReadingForm
          key={formKey}
          reading={editing}
          preset={preset}
          autoFocus={Boolean(editing || preset)}
          onSave={editing ? saveEdit : addReading}
          onCancel={resetForm}
          onDelete={deleteEditing}
        />
      </section>

      <section className="section" aria-labelledby="logbook-heading">
        <div className="section-header">
          <h2 id="logbook-heading">Logbook</h2>
          <div className="row-actions">
            <OrderToggle order={order} onChange={setOrder} />
            <MonthNav month={month} onChange={setMonth} />
          </div>
        </div>
        <FormError error={error} />
        <Logbook
          readings={monthReadings}
          order={order}
          onSelect={startEdit}
          emptyText="No readings this month. Add one above and it will show up here."
        />
      </section>
    </>
  );
}
